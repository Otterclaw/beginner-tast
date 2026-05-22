const cloud = require('wx-server-sdk');
const XLSX = require('xlsx');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// Excel列定义 — 完全按照截图结构
const COLUMNS = [
  { key: '_seq',          header: '序号',                   width: 6  },
  { key: '获奖年月',      header: '获奖年月',               width: 10 },
  { key: '项目类型',      header: '项目类型',               width: 14 },
  { key: '赛项名称',      header: '赛项名称',               width: 36 },
  { key: '主办单位',      header: '主办单位',               width: 36 },
  { key: '级别',          header: '级别',                   width: 8  },
  { key: '类别',          header: '类别',                   width: 6  },
  { key: '名次',          header: '名次',                   width: 10 },
  { key: '学生姓名',      header: '学生姓名',               width: 16 },
  { key: '指导老师',      header: '指导老师',               width: 14 },
  { key: '本专科',        header: '本/专科',                width: 8  },
  { key: '学院名称',      header: '学院名称',               width: 14 },
  { key: '专业名称',      header: '获奖学生所属专业名称',   width: 20 },
  { key: '是否教育部认定',header: '是否属于教育部认定竞赛', width: 20 },
  { key: '证书编号',      header: '证书编号',               width: 18 },
  { key: '上传日期',      header: '上传日期',               width: 12 },
];

function buildSheet(rows) {
  const headerRow = COLUMNS.map(c => c.header);
  const dataRows = rows.map((row, idx) =>
    COLUMNS.map(col => {
      if (col.key === '_seq') return idx + 1;
      return row[col.key] !== undefined ? row[col.key] : '';
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // 设置列宽
  ws['!cols'] = COLUMNS.map(c => ({ wch: c.width }));

  // 设置表头行样式（加粗、背景色）
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellAddr]) {
      ws[cellAddr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: '1565C0' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top:    { style: 'thin', color: { rgb: 'BBBBBB' } },
          bottom: { style: 'thin', color: { rgb: 'BBBBBB' } },
          left:   { style: 'thin', color: { rgb: 'BBBBBB' } },
          right:  { style: 'thin', color: { rgb: 'BBBBBB' } },
        },
      };
    }
  }

  return ws;
}

exports.main = async (event) => {
  const { year } = event;

  // 查询数据库
  let query = db.collection('awards').orderBy('获奖年月', 'asc').orderBy('创建时间', 'asc');
  if (year) {
    query = db.collection('awards')
      .where({ 获奖年月: db.RegExp({ regexp: `^${year}`, options: 'i' }) })
      .orderBy('获奖年月', 'asc');
  }

  // 分批查询（云数据库单次最多100条）
  const allRecords = [];
  const pageSize = 100;
  let skip = 0;
  while (true) {
    const { data } = await query.skip(skip).limit(pageSize).get();
    allRecords.push(...data);
    if (data.length < pageSize) break;
    skip += pageSize;
  }

  // 按年份分组
  const yearGroups = {};
  allRecords.forEach(record => {
    const y = record.获奖年月
      ? record.获奖年月.split('.')[0]
      : record.上传日期
      ? record.上传日期.split('-')[0]
      : '未知';
    if (!yearGroups[y]) yearGroups[y] = [];
    yearGroups[y].push(record);
  });

  const wb = XLSX.utils.book_new();

  const sortedYears = Object.keys(yearGroups).sort((a, b) => Number(b) - Number(a));

  if (sortedYears.length === 0) {
    // 空数据也生成一个带表头的sheet
    const ws = buildSheet([]);
    XLSX.utils.book_append_sheet(wb, ws, '暂无数据');
  } else {
    sortedYears.forEach(y => {
      const ws = buildSheet(yearGroups[y]);
      XLSX.utils.book_append_sheet(wb, ws, `${y}年`);
    });
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', bookSST: false });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cloudPath = `exports/获奖信息_${year || '全部'}_${timestamp}.xlsx`;

  const uploadResult = await cloud.uploadFile({
    cloudPath,
    fileContent: buffer,
  });

  const { fileList } = await cloud.getTempFileURL({
    fileList: [uploadResult.fileID],
  });

  return {
    success: true,
    fileID: uploadResult.fileID,
    tempUrl: fileList[0].tempFileURL,
    recordCount: allRecords.length,
    yearCount: sortedYears.length,
  };
};
