// Génère data.json : données de démonstration crédibles pour capturer les vrais écrans du site.
import fs from 'node:fs'
const d = JSON.parse(fs.readFileSync(new URL('./data.json', import.meta.url)))
let seed = 42
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const pick = a => a[Math.floor(rnd() * a.length)]
const P = ['Camille','Lucas','Inès','Hugo','Léa','Nathan','Chloé','Adam','Jade','Louis','Emma','Tom','Manon','Gabriel','Sarah','Raphaël','Zoé','Arthur','Lina','Jules','Alice','Noah','Rose','Paul','Anna','Théo','Mila','Sacha','Lou','Maël','Julia','Nolan','Eva','Ethan','Clara','Yanis','Margaux','Léo','Nina','Victor']
const N = ['Roux','Martin','Bernard','Petit','Moreau','Laurent','Simon','Michel','Lefebvre','Garcia','David','Bertrand','Fontaine','Rousseau','Vincent','Muller','Faure','André','Mercier','Blanc','Guerin','Boyer','Garnier','Chevalier','Francois','Legrand','Gauthier','Perrin','Robin','Clement','Morin','Nicolas','Henry','Roussel','Mathieu','Gautier','Masson','Marchand','Duval','Denis']
const clients = []
for (let i = 0; i < 248; i++) {
  const prenom = i === 0 ? 'Camille' : pick(P), nom = i === 0 ? 'Roux' : pick(N)
  const day = 1 + Math.floor(rnd() * 28)
  clients.push({ id: `c${1001 + i}`, prenom, nom, type_wallet: rnd() < 0.69 ? 'apple' : 'google', points: i === 0 ? 460 : Math.round(rnd() * 48) * 10,
    telephone: `06${String(12345678 + i * 1111).padStart(8, '0').slice(0, 8)}`, email: `${prenom}.${nom}@mail.fr`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
    marketing_optin: rnd() < 0.88, created_at: `2026-${pick(['06','07','08','09','10'])}-${String(day).padStart(2,'0')}T10:00:00Z`, last_activity: `2026-11-0${1 + Math.floor(rnd() * 7)}T1${Math.floor(rnd()*9)}:00:00Z` })
}
clients[0].marketing_optin = true
const R = d.routes
R['GET /pro/clients'] = clients
R['GET /pro/status'] = { ...R['GET /pro/status'], client_count: 248 }
const daily = []
for (let k = 29; k >= 0; k--) {
  const dt = new Date(Date.UTC(2026, 10, 8 - k)); const dow = dt.getUTCDay()
  daily.push({ date: dt.toISOString().slice(0, 10), scans: Math.round((dow === 0 ? 18 : dow === 6 ? 68 : 38) * (0.75 + rnd() * 0.5) * (1 + (29 - k) / 70)) })
}
R['GET /pro/stats/activity.*'] = { daily, byDayOfWeek: [1,2,3,4,5,6,7].map(dow => ({ dow, scans: [140,150,160,175,210,260,90][dow-1] })),
  byHour: Array.from({ length: 13 }, (_, i) => ({ hour: 8 + i, scans: Math.round(30 + 90 * Math.exp(-((8 + i - 12.5) ** 2) / 3) + 60 * Math.exp(-((8 + i - 17.5) ** 2) / 2)) })) }
R['GET /pro/stats/clients'] = { retention: { last7days: 121, last30days: 186, last90days: 231, inactive: 17, total: 248 },
  growth: [['2026-06',22],['2026-07',38],['2026-08',41],['2026-09',57],['2026-10',48],['2026-11',42]].map(([month,newClients]) => ({ month, newClients })),
  distribution: [{ label: '0-100', value: 64 }, { label: '100-300', value: 92 }, { label: '300-500', value: 71 }, { label: '500+', value: 21 }] }
R['GET /pro/stats/rewards'] = { totals: { totalPointsSpent: 38500, totalRedemptions: 77 }, monthly: [['2026-06',4],['2026-07',9],['2026-08',12],['2026-09',16],['2026-10',19],['2026-11',17]].map(([month, redemptions]) => ({ month, redemptions })),
  tiers: [{ id: 1, points_required: 500, title: 'Un café offert', redemptions: 61 }, { id: 2, points_required: 1000, title: 'Une pâtisserie offerte', redemptions: 16 }] }
R['GET /pro/notifications/history'] = { notifications: [
  { id: 3, created_at: '2026-11-04T11:30:00Z', title: 'Le chocolat chaud est de retour', recipients_count: 211 },
  { id: 2, created_at: '2026-10-24T10:30:00Z', title: 'Le croissant du mois est là', recipients_count: 198 },
  { id: 1, created_at: '2026-10-10T09:00:00Z', title: '-20 % sur les boissons ce week-end', recipients_count: 176 }], total: 3 }
R['POST /pro/notifications/send'] = { success: true, message: 'Notification envoyée à 219 client(s)' }
fs.writeFileSync(new URL('./data.json', import.meta.url), JSON.stringify(d, null, 1))
console.log(Object.keys(R).length, 'routes')
