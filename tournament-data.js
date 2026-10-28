window.TDA_TOURNAMENT = {
  settings: {
    tournamentName: 'TDA Open 2026',
    playerTarget: 20,
    teamCount: 10,
    groups: ['A', 'B']
  },

  players: [
    { id: 'P01', name: 'Nguyễn Phương Thái', rank: 'S' },
    { id: 'P02', name: 'Khúc Chí Phát', rank: 'C' },
    { id: 'P03', name: 'Đào Văn Tài', rank: 'B' },
    { id: 'P04', name: 'Phạm Đức Mạnh', rank: 'D' },
    { id: 'P05', name: 'Trần Đình Lực', rank: 'B' },
    { id: 'P06', name: 'Cơ thủ 6', rank: 'D' },
    { id: 'P07', name: 'Cơ thủ 7', rank: 'A' },
    { id: 'P08', name: 'Trịnh Quốc Tuấn', rank: 'D' },
    { id: 'P09', name: 'Cơ thủ 9', rank: 'B' },
    { id: 'P10', name: 'Đào Phương Nguyên', rank: 'F' },
    { id: 'P11', name: 'Nguyễn Văn Hải', rank: 'C' },
    { id: 'P12', name: 'Cơ thủ 12', rank: 'D' },
    { id: 'P13', name: 'Cơ thủ 13', rank: 'B' },
    { id: 'P14', name: 'Cơ thủ 14', rank: 'C' },
    { id: 'P15', name: 'Cơ thủ 15', rank: 'B' },
    { id: 'P16', name: 'Cơ thủ 16', rank: 'D' },
    { id: 'P17', name: 'Cơ thủ 17', rank: 'B' },
    { id: 'P18', name: 'Cơ thủ 18', rank: 'C' },
    { id: 'P19', name: 'Cơ thủ 19', rank: 'B' },
    { id: 'P20', name: 'Cơ thủ 20', rank: 'C' }
  ],

  teams: [
    { id: 'T01', name: 'Đội 1', group: 'B', playerIds: ['P01', 'P02'] },
    { id: 'T02', name: 'Đội 2', group: 'B', playerIds: ['P03', 'P04'] },
    { id: 'T03', name: 'Đội 3', group: 'A', playerIds: ['P05', 'P06'] },
    { id: 'T04', name: 'Đội 4', group: 'A', playerIds: ['P07', 'P08'] },
    { id: 'T05', name: 'Đội 5', group: 'A', playerIds: ['P09', 'P10'] },
    { id: 'T06', name: 'Đội 6', group: 'B', playerIds: ['P11', 'P12'] },
    { id: 'T07', name: 'Đội 7', group: 'B', playerIds: ['P13', 'P14'] },
    { id: 'T08', name: 'Đội 8', group: 'A', playerIds: ['P15', 'P16'] },
    { id: 'T09', name: 'Đội 9', group: 'A', playerIds: ['P17', 'P18'] },
    { id: 'T10', name: 'Đội 10', group: 'B', playerIds: ['P19', 'P20'] }
  ],

  matches: {
    group: [
      { no: 1, table: 1, group: 'B', home: 'T02', away: 'T07', scoreHome: null, scoreAway: null },
      { no: 2, table: 2, group: 'B', home: 'T01', away: 'T06', scoreHome: null, scoreAway: null },
      { no: 3, table: 3, group: 'A', home: 'T09', away: 'T08', scoreHome: null, scoreAway: null },
      { no: 4, table: 4, group: 'A', home: 'T03', away: 'T04', scoreHome: null, scoreAway: null },
      { no: 5, table: 1, group: 'B', home: 'T02', away: 'T06', scoreHome: null, scoreAway: null },
      { no: 6, table: 2, group: 'B', home: 'T01', away: 'T10', scoreHome: null, scoreAway: null },
      { no: 7, table: 3, group: 'A', home: 'T09', away: 'T05', scoreHome: null, scoreAway: null },
      { no: 8, table: 4, group: 'A', home: 'T04', away: 'T08', scoreHome: null, scoreAway: null },
      { no: 9, table: 1, group: 'B', home: 'T02', away: 'T01', scoreHome: null, scoreAway: null },
      { no: 10, table: 2, group: 'B', home: 'T07', away: 'T10', scoreHome: null, scoreAway: null },
      { no: 11, table: 3, group: 'A', home: 'T09', away: 'T03', scoreHome: null, scoreAway: null },
      { no: 12, table: 4, group: 'A', home: 'T05', away: 'T08', scoreHome: null, scoreAway: null },
      { no: 13, table: 1, group: 'B', home: 'T02', away: 'T10', scoreHome: null, scoreAway: null },
      { no: 14, table: 2, group: 'B', home: 'T06', away: 'T07', scoreHome: null, scoreAway: null },
      { no: 15, table: 3, group: 'A', home: 'T04', away: 'T05', scoreHome: null, scoreAway: null },
      { no: 16, table: 4, group: 'A', home: 'T08', away: 'T03', scoreHome: null, scoreAway: null },
      { no: 17, table: 1, group: 'B', home: 'T10', away: 'T06', scoreHome: null, scoreAway: null },
      { no: 18, table: 2, group: 'B', home: 'T01', away: 'T07', scoreHome: null, scoreAway: null },
      { no: 19, table: 3, group: 'A', home: 'T09', away: 'T04', scoreHome: null, scoreAway: null },
      { no: 20, table: 4, group: 'A', home: 'T03', away: 'T05', scoreHome: null, scoreAway: null }
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
