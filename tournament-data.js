/**
 * TDA OPEN 2026 — MASTER DATA
 * Chỉ chỉnh sửa dữ liệu giải đấu trong file này.
 * Không cần sửa app.js hoặc index.html.
 */
window.TDA_TOURNAMENT = {
  settings: {
    tournamentName: 'TDA Open 2026',
    playerTarget: 20,
    teamCount: 10,
    groups: ['A', 'B']
  },

  // rank hợp lệ: S, A, B, C, D, F
  players: [
    { id: 'P01', name: 'Nguyễn Hoàng Anh', rank: 'S' },
    { id: 'P02', name: 'Trần Minh Đức', rank: 'A' },
    { id: 'P03', name: 'Lê Quốc Bảo', rank: 'A' },
    { id: 'P04', name: 'Phạm Tuấn Kiệt', rank: 'B' },
    { id: 'P05', name: 'Vũ Thành Long', rank: 'B' },
    { id: 'P06', name: 'Đỗ Anh Quân', rank: 'C' },
    { id: 'P07', name: 'Bùi Gia Huy', rank: 'C' },
    { id: 'P08', name: 'Nguyễn Trung Hiếu', rank: 'D' },
    { id: 'P09', name: 'Hoàng Nam Khánh', rank: 'D' },
    { id: 'P10', name: 'Trịnh Công Minh', rank: 'F' },
    { id: 'P11', name: 'Đặng Duy Khang', rank: 'F' },
    { id: 'P12', name: 'Mai Đức Thịnh', rank: 'F' }
  ],

  // Sau khi bắt cặp, điền playerId tương ứng vào từng đội.
  teams: [
    { id: 'T01', name: 'Đội 1', group: 'A', playerIds: ['P01', 'P10'], substituteId: '' },
    { id: 'T02', name: 'Đội 2', group: 'A', playerIds: ['P02', 'P09'], substituteId: '' },
    { id: 'T03', name: 'Đội 3', group: 'A', playerIds: ['P03', 'P08'], substituteId: '' },
    { id: 'T04', name: 'Đội 4', group: 'A', playerIds: ['P04', 'P07'], substituteId: '' },
    { id: 'T05', name: 'Đội 5', group: 'A', playerIds: ['P05', 'P06'], substituteId: '' },
    { id: 'T06', name: 'Đội 6', group: 'B', playerIds: [], substituteId: '' },
    { id: 'T07', name: 'Đội 7', group: 'B', playerIds: [], substituteId: '' },
    { id: 'T08', name: 'Đội 8', group: 'B', playerIds: [], substituteId: '' },
    { id: 'T09', name: 'Đội 9', group: 'B', playerIds: [], substituteId: '' },
    { id: 'T10', name: 'Đội 10', group: 'B', playerIds: [], substituteId: '' }
  ],

  // scoreHome/scoreAway: để null nếu trận chưa đấu. Đội thắng được +1 điểm.
  matches: {
    group: [
      { no: 1, table: 1, group: 'B', home: 'T02', away: 'T07', scoreHome: 2, scoreAway: 0 },
      { no: 2, table: 2, group: 'B', home: 'T01', away: 'T06', scoreHome: 2, scoreAway: 1 },
      { no: 3, table: 3, group: 'A', home: 'T09', away: 'T08', scoreHome: 2, scoreAway: 1 },
      { no: 4, table: 4, group: 'A', home: 'T03', away: 'T04', scoreHome: 0, scoreAway: 2 },
      { no: 5, table: 1, group: 'B', home: 'T02', away: 'T06', scoreHome: 0, scoreAway: 2 },
      { no: 6, table: 2, group: 'B', home: 'T01', away: 'T10', scoreHome: 0, scoreAway: 2 },
      { no: 7, table: 3, group: 'A', home: 'T09', away: 'T05', scoreHome: 2, scoreAway: 1 },
      { no: 8, table: 4, group: 'A', home: 'T04', away: 'T08', scoreHome: 2, scoreAway: 1 },
      { no: 9, table: 1, group: 'B', home: 'T02', away: 'T01', scoreHome: 2, scoreAway: 1 },
      { no: 10, table: 2, group: 'B', home: 'T07', away: 'T10', scoreHome: 0, scoreAway: 2 },
      { no: 11, table: 3, group: 'A', home: 'T09', away: 'T03', scoreHome: 2, scoreAway: 0 },
      { no: 12, table: 4, group: 'A', home: 'T05', away: 'T08', scoreHome: 2, scoreAway: 0 },
      { no: 13, table: 1, group: 'B', home: 'T02', away: 'T10', scoreHome: 0, scoreAway: 2 },
      { no: 14, table: 2, group: 'B', home: 'T06', away: 'T07', scoreHome: 0, scoreAway: 2 },
      { no: 15, table: 3, group: 'A', home: 'T04', away: 'T05', scoreHome: 1, scoreAway: 2 },
      { no: 16, table: 4, group: 'A', home: 'T08', away: 'T03', scoreHome: 2, scoreAway: 1 },
      { no: 17, table: 1, group: 'B', home: 'T10', away: 'T06', scoreHome: 2, scoreAway: 1 },
      { no: 18, table: 2, group: 'B', home: 'T01', away: 'T07', scoreHome: 1, scoreAway: 2 },
      { no: 19, table: 3, group: 'A', home: 'T09', away: 'T04', scoreHome: 1, scoreAway: 2 },
      { no: 20, table: 4, group: 'A', home: 'T03', away: 'T05', scoreHome: 2, scoreAway: 1 }
    ],
    semifinal: [
      { no: 1, table: 1, home: 'Nhất bảng A', away: 'Nhì bảng B', scoreHome: null, scoreAway: null },
      { no: 2, table: 2, home: 'Nhất bảng B', away: 'Nhì bảng A', scoreHome: null, scoreAway: null }
    ],
    final: [
      { no: 1, table: 1, home: 'Thắng bán kết 1', away: 'Thắng bán kết 2', scoreHome: null, scoreAway: null }
    ]
  }
};
