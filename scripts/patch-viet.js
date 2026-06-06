const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'screens', 'DashboardScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  ['Dang chuan bi tai chinh...', '\u0110ang chu\u1ea9n b\u1ecb t\u00e0i ch\u00ednh...'],
  ['+ Giao dich', '+ Giao d\u1ecbch'],
  ['Chon vi tai chinh', 'Ch\u1ecdn v\u00ed t\u00e0i ch\u00ednh'],
  ['Phan phoi 6 Hu Tai Chinh', 'Ph\u00e2n ph\u1ed1i 6 H\u0169 T\u00e0i Ch\u00ednh'],
  ['Chua co hu nao. Hay thiet lap ngan sach nhe!', 'Ch\u01b0a c\u00f3 h\u0169 n\u00e0o. H\u00e3y thi\u1ebft l\u1eadp ng\u00e2n s\u00e1ch nh\u00e9!'],
  ['Da vuot han muc!', '\u0110\u00e3 v\u01b0\u1ee3t h\u1ea1n m\u1ee9c!'],
  ['Chi tieu qua nhanh!', 'Chi ti\u00eau qu\u00e1 nhanh!'],
  ['Co hu vuot ngan sach', 'C\u00f3 h\u0169 v\u01b0\u1ee3t ng\u00e2n s\u00e1ch'],
  ['Chi tieu dang nhanh', 'Chi ti\u00eau \u0111ang nhanh'],
  ['Tai chinh on dinh', 'T\u00e0i ch\u00ednh \u1ed5n \u0111\u1ecbnh'],
  ['Hay quan ly tai chinh that chill cung Capy moi ngay nhe!', 'H\u00e3y qu\u1ea3n l\u00fd t\u00e0i ch\u00ednh th\u1eadt chill c\u00f9ng Capy m\u1ed7i ng\u00e0y nh\u00e9!'],
  ['Tai chinh thanh thoi', 'T\u00e0i ch\u00ednh th\u1ea3nh th\u01a1i \u2728'],
  ['name: "Thiet yeu"', 'name: "Thi\u1ebft y\u1ebfu"'],
  ['name: "Tiet kiem"', 'name: "Ti\u1ebft ki\u1ec7m"'],
  ['name: "Tu do TC"', 'name: "T\u1ef1 do TC"'],
  ['name: "Giao duc"', 'name: "Gi\u00e1o d\u1ee5c"'],
  ['name: "Huong thu"', 'name: "H\u01b0\u1edfng th\u1ee5"'],
  ['name: "Cho di"', 'name: "Cho \u0111i"'],
  ['Oi ban oi! Co hu bi vuot ngan sach kia, hay kiem soat chi tieu lai nha!', 'O\u00f4i b\u1ea1n \u01a1i! C\u00f3 h\u0169 b\u1ecb v\u01b0\u1ee3t ng\u00e2n s\u00e1ch kia, h\u00e3y ki\u1ec3m so\u00e1t chi ti\u00eau l\u1ea1i nh\u00e9!'],
  ['Can than nha, ban dang tieu hoi bi nhanh cho mot so hu day!', 'C\u1ea9n th\u1eadn nh\u00e9, b\u1ea1n \u0111ang ti\u00eau h\u01a1i nhanh cho m\u1ed9t s\u1ed1 h\u0169 \u0111\u1ea5y!'],
];

for (const [from, to] of replacements) {
  content = content.split(from).join(to);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched Vietnamese text successfully in DashboardScreen.tsx');
