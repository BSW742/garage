import type { APIRoute } from 'astro';

export const prerender = false;

// One site an hour, unattended.
//
// Real first: it looks for an actual business in a random town and scrapes it,
// because a real page beats an invented one every time. If the scrape comes
// back thin — no photographs, no phone — it writes an invented one instead
// rather than publishing something threadbare. "Prioritise quality content"
// means the fallback is a better page, not a worse one.
//
// The cost ceiling is the same shape as the chat assistant: counted from
// agent_usage before anything is spent, so an unattended job cannot run away
// overnight. Sonnet, capped output.
//
// MAX_PER_DAY and the cron trigger in sites-worker/wrangler.toml are one
// setting in two files and always move together. 72 against an hourly trigger
// leaves the ceiling slack so it never binds; 24 against a twenty-minute
// trigger stops the job around lunchtime and the log says nothing about why.
// It was 72 and every twenty minutes from 28 to 30 Aug 2026 for a stress test.
//
// Each run costs real money: the Anthropic call is billed as pay-as-you-go API
// credit, which is not a Claude subscription and has nothing to do with any
// laptop being awake. Roughly a dollar a day at this rate. When the balance
// runs out every run fails, and the failure now reports the API's own words
// rather than guessing at truncated JSON.

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

const MODEL = 'claude-sonnet-5';
const MAX_PER_DAY = 24;
const MAX_OUT = 2000;

// Some pages are simply longer than others and the cap has to know it. A club
// carries grades, sponsors, a draw, subs, training nights, a committee and the
// numbers; a hall carries rooms, capacities, an inventory and the bond. At 2000
// tokens those came back truncated mid-JSON, or complete but missing a required
// section because the model ran out of room and dropped one. Three failures out
// of four rugby and football runs, against none for beauty.
//
// This stays a per-style constant rather than a global raise so the ceiling is
// still a number anyone can multiply out: the long styles cost about a third
// more per run, and nothing else changed.
const LONG_STYLES = new Set(['rugby', 'soccer', 'basketball', 'townhall', 'daycare']);
const outFor = (style: string) => (LONG_STYLES.has(style) ? 3000 : MAX_OUT);

// Business styles only. Nobody wants a memorial or a food diary spawned at 3am.
const STYLES = ['modern', 'classic', 'cafe', 'physio', 'trade', 'beauty', 'yoga',
                'pilates', 'eggs', 'mogged', 'bubbles', 'workshop', 'sauna', 'rugby', 'soccer', 'basketball',
                'charity', 'townhall', 'daycare'];

const TOWNS = [
  // Aotearoa
  'Raglan', 'Whanganui', '\u014camaru', 'Gisborne', 'Nelson', 'Motueka', 'Greymouth',
  'Timaru', 'Masterton', 'Levin', 'Te Awamutu', 'Cambridge', 'Katikati', 'Taup\u014d',
  'Whakat\u0101ne', '\u014chope', 'Kaikoura', 'Wanaka', 'Riverton', 'Dargaville',
  'Kerikeri', 'Waih\u012b Beach', 'Martinborough', 'Featherston', 'Hokitika', 'Methven',
  // Australia
  'Byron Bay', 'Bellingen', 'Castlemaine', 'Daylesford', 'Margaret River', 'Fremantle',
  'Port Fairy', 'Bright', 'Maleny', 'Bermagui', 'Strahan', 'Kangaroo Valley',
];

// What a page of this kind is missing if it does not have it. A pilates studio
// without a timetable is not a thin page, it is the wrong page — so these are
// named in the prompt and checked again in the score.
const MUST: Record<string, { sections: string[]; say: string }> = {
  cafe:    { sections: ['menu', 'hours'], say: 'a menu with real dishes and prices, and opening hours' },
  physio:  { sections: ['services', 'hours'], say: 'what you treat, and opening hours' },
  trade:   { sections: ['services'], say: 'the work you do, and the areas you cover' },
  beauty:  { sections: ['menu', 'hours'], say: 'treatments with durations and prices, and opening hours' },
  rugby:   { sections: ['menu', 'rates', 'hours'], say: 'the grades with their age bands, the subs, and training nights' },
  soccer:  { sections: ['menu', 'rates', 'hours'], say: 'the grades with their age bands, the subs, and training nights' },
  basketball:{ sections: ['menu', 'rates', 'hours'], say: 'the grades with their age bands, the subs, and training nights' },
  charity: { sections: ['menu', 'rates'], say: 'what specific amounts of money actually buy, and where the money goes' },
  townhall:{ sections: ['menu', 'specs', 'credentials', 'conditions'], say: 'the rooms with their hourly rates, what the hall holds for each layout, what comes with it, and the bond' },
  daycare: { sections: ['menu', 'conditions', 'specs', 'steps'], say: 'the fees banded by age, how 20 Hours ECE works, the ratios, and how a day goes' },
  workshop:{ sections: ['menu', 'faq'], say: 'the classes with prices, how long each runs, how many at the bench, and what the person takes home' },
  sauna:   { sections: ['menu', 'steps', 'conditions', 'specs'], say: 'the round explained step by step with times a beginner can follow, sessions and passes with prices, how hot and how cold it runs, and a plain safety note' },
  yoga:    { sections: ['menu', 'pricing'], say: 'a full weekly timetable and the passes with prices' },
  pilates: { sections: ['menu', 'pricing'], say: 'a full weekly timetable and the passes with prices' },
  eggs:    { sections: ['credentials', 'specs'], say: 'certifications and the numbers' },
  mogged:  { sections: ['services', 'included'], say: 'what you do and three short proof points' },
  bubbles: { sections: [], say: 'a short about, and let the pictures carry it' },
  modern:  { sections: ['services', 'hours'], say: 'services and opening hours' },
  classic: { sections: ['services', 'hours'], say: 'services and opening hours' },
};

const WHAT: Record<string, string> = {
  modern: 'a small service business', classic: 'a long-established local firm',
  cafe: 'a cafe', physio: 'a physiotherapy clinic', trade: 'a building or trades business',
  rugby: 'a community rugby club', soccer: 'a community football club',
  basketball: 'a community basketball club', charity: 'a small charitable trust running an appeal',
  townhall: 'a community hall let out by the hour', daycare: 'an early childhood centre',
  beauty: 'a beauty salon or day spa', workshop: 'a pottery or jewellery studio that teaches classes', sauna: 'a sauna and ice bath studio', yoga: 'a yoga studio', pilates: 'a reformer pilates studio',
  eggs: 'a food producer or grower', mogged: 'a small creative agency or consultancy',
  bubbles: 'an artist, maker or gallery',
};

const PHOTOS: Record<string, string[]> = {
  // Every id here was fetched from the CDN before it went in. Which of them a
  // new site may use is decided at spawn time by spokenFor() — a photograph
  // already on a page is not offered again.
  modern: ['photo-1472851294608-062f824d29cc', 'photo-1528698827591-e19ccd7bc23d', 'photo-1542715473-63675d7974bd', 'photo-1610839123817-236de748e5c9', 'photo-1595245761073-0eb3ca3f179c', 'photo-1661615277524-c7e67b240e95', 'photo-1656443046114-08c6dac52aa2'],
  classic: ['photo-1775622360538-7b5b9891c48c', 'photo-1672777368849-9f55d9dd3623', 'photo-1595057243976-875ee35f8dda', 'photo-1705522330262-f8efe5094f00', 'photo-1780765896926-8cc2d92cb069', 'photo-1633949970272-3421a17b5e32', 'photo-1705522330271-25d1a9cbdcdc', 'photo-1786282082303-c94d070d4b1c'],
  cafe: ['photo-1704707626060-9b342f92a1b4', 'photo-1780312239639-738b1da1dfa2', 'photo-1670404161019-2c06269de22e', 'photo-1670710029529-48fe1bc2eb3d', 'photo-1677825950108-57a3ed44195e', 'photo-1645436095409-ccb65f96527f', 'photo-1719377058431-834b0772861b', 'photo-1567880905822-56f8e06fe630', 'photo-1521017432531-fbd92d768814', 'photo-1494346480775-936a9f0d0877', 'photo-1511081692775-05d0f180a065', 'photo-1453614512568-c4024d13c247', 'photo-1613274554329-70f997f5789f', 'photo-1648462908676-8305f0eff8e0', 'photo-1583354608715-177553a4035e', 'photo-1538333581680-29dd4752ddf2', 'photo-1600353565737-2427a1ba3d3a', 'photo-1588253137728-1e4dd0fe9a93', 'photo-1482350325005-eda5e677279b', 'photo-1545418314-7ce0b9b53901', 'photo-1612192527395-06b72da6b35a', 'photo-1565650839149-2c48a094196c'],
  physio: ['photo-1754941622136-6664a3f50b2e', 'photo-1770012905139-713758ded6ec', 'photo-1649751361457-01d3a696c7e6', 'photo-1645005512942-a17817fb7c11', 'photo-1768507423533-b87b62769758', 'photo-1630226040750-d934f017f0e4', 'photo-1709880754472-be89c13abc52', 'photo-1706353399656-210cca727a33', 'photo-1668422550557-f096364b72b4'],
  trade: ['photo-1587582423116-ec07293f0395', 'photo-1589939705384-5185137a7f0f', 'photo-1626885930974-4b69aa21bbf9', 'photo-1595844730298-b960ff98fee0', 'photo-1694522362256-6c907336af43', 'photo-1646324554833-f0b6a479fa5d', 'photo-1513467535987-fd81bc7d62f8', 'photo-1667923006173-9e0d2251f608', 'photo-1593313637552-29c2c0dacd35', 'photo-1632862378103-8248dccb7e3d', 'photo-1630683924997-fe27050a0416', 'photo-1608613304899-ea8098577e38', 'photo-1593786267440-550458cc882a', 'photo-1505798577917-a65157d3320a', 'photo-1631396326838-de37e5f8bcbc', 'photo-1581141849291-1125c7b692b5'],
  beauty: ['photo-1598901986949-f593ff2a31a6', 'photo-1570172619644-dfd03ed5d881', 'photo-1643684391140-c5056cfd3436', 'photo-1616394584738-fc6e612e71b9', 'photo-1761718209835-c8586b7dcac0', 'photo-1761718209708-9ab9ba1c7252', 'photo-1634449571010-02389ed0f9b0', 'photo-1521590832167-7bcbfaa6381f', 'photo-1629397685944-7073f5589754', 'photo-1595476108010-b4d1f102b1b1', 'photo-1580618672591-eb180b1a973f', 'photo-1731514771613-991a02407132', 'photo-1695527081848-1e46c06e6458', 'photo-1675034743339-0b0747047727', 'photo-1717160675489-7779f2c91999', 'photo-1717160675643-53a7a2ebaa9f', 'photo-1595871151608-bc7abd1caca3', 'photo-1675034743469-4e262c2ff3ef', 'photo-1633681138600-295fcd688876', 'photo-1761718210089-ba3bb5ccb54f'],
  yoga: ['photo-1761971975724-31001b4de0bf', 'photo-1761971975962-9cc397e2ba2a', 'photo-1676496962536-d8ef110ff6f0', 'photo-1599447421430-976c0f776d43', 'photo-1599447421338-2d21d3530aeb', 'photo-1636990628724-cb59f83326d7', 'photo-1626444232874-e72c020eeb0e', 'photo-1651077837628-52b3247550ae', 'photo-1617734417481-aafe074f1b86', 'photo-1761035005546-62b8018b212a', 'photo-1651077920873-ac1be1b82290', 'photo-1763403921315-f2ef8697199f', 'photo-1787647090307-706df57182d3', 'photo-1671581084344-3d83ae383a83', 'photo-1671581081519-321ab53e0dac', 'photo-1671581084367-1bf522951eae', 'photo-1617734423221-dd4ad460bad6', 'photo-1671581084718-c4c04fc00250'],
  pilates: ['photo-1717500252297-b09508db7ceb', 'photo-1747238415033-b74eec07eb59', 'photo-1747239685045-fcbcf98985db', 'photo-1747239202356-764770773c9a', 'photo-1747240031720-dced770be260', 'photo-1747237602396-20cb5331ee7b', 'photo-1747239069226-55382c570116', 'photo-1747240549807-fc3962949818', 'photo-1717500252573-d31d4bf5ddf1', 'photo-1717500251716-27057c48ace4', 'photo-1715780463401-b9ef0567943e'],
  eggs: ['photo-1518569656558-1f25e69d93d7', 'photo-1582722872445-44dc5f7e3c8f', 'photo-1607690424560-35d967d6ad7c', 'photo-1612170153139-6f881ff067e0', 'photo-1519710164239-da123dc03ef4', 'photo-1598965675045-45c5e72c7d05', 'photo-1585355611266-f01530088d60', 'photo-1585355611347-6fb3aca79111', 'photo-1585355611468-3c418173f128', 'photo-1585355611444-06154f329e96', 'photo-1773587534652-1c823227b555', 'photo-1658094048401-7ce081dd3b5e'],
  mogged: ['photo-1637250060437-eaad0291deff', 'photo-1608666599953-b951163495f4', 'photo-1561070791-2526d30994b5', 'photo-1647427854253-b92bb40c9330', 'photo-1682056598904-9aa7ea5e8991', 'photo-1612544409025-e1f6a56c1152', 'photo-1685654065306-b9ff8af8f68d', 'photo-1574856049959-d3134a3e592f', 'photo-1637250096679-c10f2751def8', 'photo-1744686909358-915e14866592', 'photo-1693159682618-074078ed271e', 'photo-1682939634610-5187eb7f9619'],
  bubbles: ['photo-1578749556568-bc2c40e68b61', 'photo-1514228742587-6b1558fcca3d', 'photo-1610701596007-11502861dcfa', 'photo-1493106641515-6b5631de4bb9', 'photo-1565193566173-7a0ee3dbe261', 'photo-1606819717115-9159c900370b', 'photo-1582481426757-274f94eecb72', 'photo-1690122582259-d3e7b2cde7ec', 'photo-1569783721854-33a99b4c0bae', 'photo-1655205145442-84abe0ae4fab', 'photo-1598154948139-a899dadb6269', 'photo-1563293743-a9761195b52e', 'photo-1597489420377-e23d4a080346', 'photo-1580687580441-96dbadf8f3c8', 'photo-1735605917461-4c1b77a6616f', 'photo-1653987255814-3b4c05832660', 'photo-1735605918310-73ad27a5dd6b', 'photo-1617386069438-6b3a5f76f0bc', 'photo-1580687580679-3f3e9ca2ef35'],
  workshop: ['photo-1753164725860-ffcd260b7b32', 'photo-1753164726043-31e583f8a9b8', 'photo-1753164725896-f0a39315ff8a', 'photo-1753164725849-54c0698969e5', 'photo-1624585179018-25699030cb8f', 'photo-1609619742069-f5e18afeef17', 'photo-1628058494685-6c2f796ac24a', 'photo-1715374033196-0ff662284a7e', 'photo-1608508644127-ba99d7732fee', 'photo-1610206349499-c932c3b3aacb', 'photo-1739467516257-20c1d7f1949a', 'photo-1739467516216-424041e6d07a', 'photo-1764507768733-667e135d8cb9', 'photo-1676125105159-517d135a6cc3', 'photo-1676125105332-608345abe20e', 'photo-1760018890645-28c8312cd7cb', 'photo-1778698993355-2c5f29edbfb9', 'photo-1772485718354-6966d953be57', 'photo-1763824371988-8c8eb3d13eff', 'photo-1776972334890-018cb3b3e3c6', 'photo-1766970421184-e3bc69e07dfc'],
  sauna: ['photo-1759216852954-88e547b8e01f', 'photo-1741601272577-fc2c46f87d9f', 'photo-1712659606957-b7395ba9ebb2', 'photo-1745894118353-88e64617e064', 'photo-1702285229572-8aa35e6e3f5d', 'photo-1734117928667-c7f943a27e80', 'photo-1712161321522-c24f686e4ace', 'photo-1712659604528-b179a3634560', 'photo-1739869481946-c054e37a55b1', 'photo-1741601273168-04934064889f', 'photo-1676452457948-7d02dff1eb43', 'photo-1583416750470-965b2707b355', 'photo-1713270176378-45fbf4a27099', 'photo-1605614307370-f7a1e58ae751', 'photo-1741601274210-14b7ab1ef99c', 'photo-1741601272384-7150b6e6b842', 'photo-1701875265510-11578d366a04', 'photo-1749561532912-41d43d889696', 'photo-1734594709647-7606448ba055', 'photo-1734594683564-cadeeaefd6cd'],
  rugby: ['photo-1480099225005-2513c8947aec', 'photo-1512299286776-c18be8ed6a1a', 'photo-1496224027003-38fc92be458c', 'photo-1529663297269-6d349ec39b57', 'photo-1558151507-c1aa3d917dbb', 'photo-1574602904329-56e2f95fb15e', 'photo-1698746019802-ec43b1b0db29', 'photo-1676972523246-2ff4125551fb', 'photo-1643096809267-38765bbfd989', 'photo-1649194050205-00ce491f62b3'],
  soccer: ['photo-1431324155629-1a6deb1dec8d', 'photo-1574629810360-7efbbe195018', 'photo-1489944440615-453fc2b6a9a9', 'photo-1517747614396-d21a78b850e8', 'photo-1522778119026-d647f0596c20', 'photo-1556056504-5c7696c4c28d', 'photo-1579952363873-27f3bade9f55', 'photo-1626248801379-51a0748a5f96', 'photo-1606925797300-0b35e9d1794e', 'photo-1624280157150-4d1ed8632989', 'photo-1517927033932-b3d18e61fb3a', 'photo-1624880357913-a8539238245b', 'photo-1569531955323-33c6b2dca44b', 'photo-1600077063877-22118d6290eb', 'photo-1543326727-cf6c39e8f84c', 'photo-1598399615261-adafbbb044fc', 'photo-1612703738893-31b58c0aebd5', 'photo-1551385093-ad3fb362dc43', 'photo-1550591901-94cca90aeab1', 'photo-1613425295165-dc4a15a98bbf'],
  basketball: ['photo-1546519638-68e109498ffc', 'photo-1608245449230-4ac19066d2d0', 'photo-1577416412292-747c6607f055', 'photo-1600534220378-df36338afc40', 'photo-1504450758481-7338eba7524a', 'photo-1629901925121-8a141c2a42f4', 'photo-1602357280104-742c517a1d82', 'photo-1505666287802-931dc83948e9', 'photo-1655151162497-065d0da01c9a', 'photo-1585070105361-a13b5623791c', 'photo-1563506644863-444710df1e03', 'photo-1542652694-40abf526446e', 'photo-1512746804203-e53e69406f93', 'photo-1602619075255-d090a7443bfb', 'photo-1639843091936-bb5fca7b5684', 'photo-1602105129381-33a03a924655', 'photo-1705706810771-b7ef95df6b44', 'photo-1531124042451-f3ba1765072c', 'photo-1716731731293-ffc5d16b6107', 'photo-1576250223658-05e6e593d8ce', 'photo-1544919982-b61976f0ba43'],
  charity: ['photo-1557660559-42497f78035b', 'photo-1706806595136-5afefb45da1a', 'photo-1560220604-1985ebfe28b1', 'photo-1758599668356-c8c919e24dda', 'photo-1787012724048-dccf455a75a4', 'photo-1778864875228-caa80c73cbd3', 'photo-1593113616828-6f22bca04804', 'photo-1628717341663-0007b0ee2597', 'photo-1599059813005-11265ba4b4ce', 'photo-1593113646773-028c64a8f1b8', 'photo-1713977331626-722cd8400b99', 'photo-1712908714811-321472432c4e', 'photo-1615897570286-da936a5dfb81', 'photo-1593113630400-ea4288922497', 'photo-1593113598332-cd288d649433', 'photo-1732194438313-40cb4261f49b', 'photo-1689010254304-c5a67880b5a1', 'photo-1653508310732-cad8be3cd260', 'photo-1695654398729-9009013ca7f4', 'photo-1733809697694-52c0c58ab888', 'photo-1650819786866-9708fd7bf3d3'],
  townhall: ['photo-1666617710768-425d2d9088f8', 'photo-1677129663241-5be1f17fe6fe', 'photo-1712314947761-a8d718bd8c32', 'photo-1768851142332-75f3d1b47452', 'photo-1768508951405-10e83c4a2872', 'photo-1759477274116-e3cb02d2b9d8', 'photo-1762765684665-6b6855bb6fe6', 'photo-1677129663678-2171fa8a44cb', 'photo-1763706320063-b210731b37a1', 'photo-1764471444363-e6dc0f9773bc', 'photo-1762765685319-fdaf8d22085d', 'photo-1762765684673-d22ece602b10', 'photo-1769638913500-4a0b6ac4561a', 'photo-1777282889677-19fe13252abf', 'photo-1765947384834-3bdcffcaffff', 'photo-1762765684810-b734486c5eda', 'photo-1709521440400-bf38b562b194', 'photo-1769667693426-6ce4b8732060', 'photo-1778086170602-f40da010e5fb', 'photo-1762765685329-97e0af04050c'],
  daycare: ['photo-1614113036347-9f60df80730a', 'photo-1578349035260-9f3d4042f1f7', 'photo-1747110604852-8f3edc2451ea', 'photo-1761208663763-c4d30657c910', 'photo-1777056491418-d4ff81a4ad92', 'photo-1600880291319-1a7499c191e8', 'photo-1587616211892-f743fcca64f9', 'photo-1567405258710-35a7015252c0', 'photo-1589856198357-4cca29e342c7', 'photo-1648143714234-810e3ce38cc6', 'photo-1633219664515-2441564d0cc4', 'photo-1574429549871-ecf3b8523655', 'photo-1784662117877-105aa6c9161d', 'photo-1759678444866-e71e5484b0e5', 'photo-1759678444821-565ff103465c', 'photo-1774641374314-6aaaf7d45d90', 'photo-1761208663281-619e6532aff3', 'photo-1759678444870-1f09f0d9e688', 'photo-1786292949404-084cbd10c7b1'],
};

// Half the runs go looking for a real business. Those are never published:
// they land disabled and unstarred, and starring one from the admin page is
// what puts it live. A page carrying somebody's real name, photographs and
// phone number should be a decision, not a side effect of a cron job.
const REAL_ODDS = 0.5;

// No photograph appears on two sites. That is the rule, and it is enforced here
// rather than hoped for: every site already published is read back, its
// pictures collected, and a spawn may only use what is left.
//
// The configs are the ledger. A separate table of claimed images would be one
// more thing to drift out of step with what the pages actually show — this
// cannot disagree with reality because it is read from it.
const PHOTO_ID = /(photo-[0-9a-z-]+)/;

async function spokenFor(db: any): Promise<Set<string>> {
  const rows = await db
    .prepare(
      `SELECT json_extract(config, '$.heroImage') AS hero,
              json_extract(config, '$.images')    AS imgs
         FROM site_claims WHERE config IS NOT NULL`
    )
    .all();
  const taken = new Set<string>();
  for (const row of rows?.results || []) {
    const urls: string[] = [];
    if (row.hero) urls.push(String(row.hero));
    try {
      const list = row.imgs ? JSON.parse(String(row.imgs)) : [];
      if (Array.isArray(list)) urls.push(...list.map(String));
    } catch { /* a config we cannot parse cannot be claiming anything */ }
    for (const url of urls) {
      const hit = PHOTO_ID.exec(url);
      if (hit) taken.add(hit[1]);
    }
  }
  return taken;
}

// A page needs a hero and enough for a gallery. Below this the page is thin
// enough that it is better not to build it than to build it twice-photographed.
// Every run says what happened, including the runs that produce nothing.
//
// Without this the job is unanswerable: a morning with nine silent slots looks
// identical to a job that never fired, and the only way to tell them apart was
// to reason backwards from which minutes have a site in them. A rejection for a
// missing section, a style with no photographs left and a model that returned
// broken JSON all used to vanish the same way.
async function note(
  db: any,
  outcome: string,
  bits: { style?: string; town?: string; detail?: string; slug?: string } = {}
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO spawn_log (id, style, town, outcome, detail, slug, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(crypto.randomUUID(), bits.style || null, bits.town || null, outcome,
            (bits.detail || '').slice(0, 200) || null, bits.slug || null,
            new Date().toISOString())
      .run();
  } catch (error) {
    // A log that cannot be written must never be the reason a site is not made.
    console.error('spawn_log write failed:', error);
  }
}

const MIN_PHOTOS = 4;
const MAX_PHOTOS = 5;

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
const shot = (id: string, w = 1600, h = 1100) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop`;

function slugify(name: string): string {
  return String(name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '').slice(0, 34);
}

const token = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * How much of a page is actually there. A site is only worth publishing if
 * somebody landing on it would learn something — so photographs and a way to
 * make contact count for more than word count.
 */
function quality(cfg: any): number {
  let n = 0;
  if (cfg?.name) n += 1;
  if (String(cfg?.lede || '').length > 60) n += 2;
  n += Math.min(4, (cfg?.images || []).length);
  if (cfg?.heroImage) n += 2;
  if (cfg?.contact?.phone) n += 2;
  if (cfg?.contact?.address) n += 1;
  for (const s of cfg?.sections || []) {
    n += Math.min(3, (s?.items || []).length);
    n += Math.min(2, (s?.rows || []).length);
    for (const g of s?.menu || []) n += Math.min(3, (g?.items || []).length);
  }
  return n;
}

const FIND = `You find one real, existing small business and return its website address.

Return ONLY a JSON object: {"url": "https://...", "name": "..."}

Rules. It must be the business's own website, not a directory, a Facebook page, an aggregator, a
franchise head office or a review site. It must currently exist. If you cannot find one you are
confident about, return {"url": null}.`;

// The real path used to skip this entirely. It read the scrape, mapped a name,
// a lede, a phone number and a pile of photographs into a shell, and held that
// — so a basketball club came out with no grades, no subs and no training
// nights, because nothing had ever been asked to write them. It looked like the
// invented sites had been made carefully and the real ones had not, which is
// exactly what happened.
//
// The hard part is that this is somebody's actual business. The invented prompt
// is told to make up prices; this one is told the opposite, in the strongest
// terms available, because a made-up subscription on a real rugby club's page
// is a lie with their name on it.
const REWRITE = `You are given the text of a real business's own website. Write their page from it.

Everything you write must come from what you are given. This is a real organisation and the page
carries their name.

NEVER invent: a price, a fee, an opening hour, a date, a phone number, an email, a staff member, a
qualification, an award, a year they were founded, or a number of members. If their site does not
say it, it does not go on the page. An empty section is correct; an invented one is not.

You may tidy their words — fix a typo, cut a sentence in half, drop the marketing padding. You may
not add a fact.

Return ONLY a JSON object, no prose around it:

{
  "name": "their actual business name, not the page title — 'Home' and 'Welcome' are not names",
  "eyebrow": "the town, or the trade and the town",
  "headline": "six words or so, from their own words where you can",
  "lede": "two sentences describing them, from their own copy",
  "cta": "two or three words",
  "sections": [ ... ]
}

Sections, using only these shapes, and only where their site gave you the content:
  {"type":"services","title":"","items":[["name","one line"], ...]}
  {"type":"menu","label":"","title":"","menu":[{"heading":"","items":[{"name":"","price":"","text":""}]}]}
  {"type":"pricing","title":"","items":[["name","$price|note"], ...]}
  {"type":"specs","title":"","items":[["label","value"], ...]}
  {"type":"credentials","title":"","items":[["name","one line"], ...]}
  {"type":"hours","rows":[["Monday","8am - 5pm"], ...]}
  {"type":"steps","title":"","items":[["step","one line"], ...]}
  {"type":"faq","title":"","items":[["question","answer"], ...]}
  {"type":"about","title":"","text":"a short paragraph"}
  {"type":"testimonial","quote":"","who":""}

New Zealand and Australian English. No exclamation marks, no marketing gloss, nothing about AI or
websites.`;

const WRITE = `You invent a small business and write its website content, for a demo.

You will be given a town and a kind of business. Invent one that would be unremarkable in that
town — a real-sounding name, the sort of thing that has been there eight years. New Zealand and
Australian small businesses, so New Zealand and Australian English: no "gotten", no "z" in
organised, no exclamation marks, no marketing gloss.

Return ONLY a JSON object, no prose around it:

{
  "name": "",
  "eyebrow": "short line, often the trade and the town",
  "headline": "six words or so",
  "lede": "two sentences a real owner might write about themselves",
  "cta": "two or three words",
  "contact": { "phone": "a plausible local number", "email": "", "address": "street and town" },
  "sections": [ ... ]
}

Sections, using only these shapes and only the ones that suit the business:
  {"type":"services","title":"","items":[["name","one line"], ...]}
  {"type":"menu","label":"","title":"","menu":[{"heading":"","items":[{"name":"","price":"","text":""}]}]}
  {"type":"pricing","title":"","items":[["name","$price|note"], ...]}
  {"type":"specs","title":"","items":[["label","value"], ...]}
  {"type":"credentials","title":"","items":[["name","one line"], ...]}
  {"type":"hours","rows":[["Monday","8am - 5pm"], ...]}
  {"type":"about","title":"","text":"a short paragraph"}
  {"type":"testimonial","quote":"","who":""}
  {"type":"band","title":"","text":""}

Fill it properly. A page with four services and no hours is a worse page than one with both.
Prices should be real numbers in local currency, not "from $X". Nothing about AI or websites.`;

// Building a page takes the model twenty to thirty seconds, and the richer
// templates take the longest — a workshop or a sauna has more required sections
// than a salon, so it writes more. That is well past what a request in front of
// Cloudflare is allowed to live for, and the first two runs of both new styles
// came back 502 at twenty-two seconds while beauty finished at fourteen.
//
// Nothing is waiting on the answer. The cron fires and forgets; the result of a
// run is a row in the database, not a response body. So the request checks the
// things that are cheap and must be right — the key, and the daily ceiling —
// and then hands the slow part to waitUntil and returns.
//
// Pass wait: true to get the old blocking behaviour. It is only useful for the
// leaner styles, and only for testing by hand.
export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals.runtime?.env as any) || {};
  const ctx = (locals.runtime as any)?.ctx;
  const db = env.DB;
  if (!db) return json({ error: 'not-configured' }, 503);

  const body = (await request.json().catch(() => null)) as any;
  const key = String(body?.key || '').trim();
  const allowed = await db
    .prepare("SELECT slug FROM site_claims WHERE slug = 'garage' AND edit_token = ?")
    .bind(key).first();
  if (!allowed) return json({ error: 'Not allowed' }, 403);

  // Ceiling first, before a cent is spent.
  const midnight = new Date(); midnight.setUTCHours(0, 0, 0, 0);
  const spent = await db
    .prepare("SELECT COUNT(*) AS n FROM agent_usage WHERE model = ? AND message_chars = -1 AND created_at > ?")
    .bind(MODEL, midnight.toISOString()).first();
  if (Number(spent?.n || 0) >= MAX_PER_DAY) {
    await note(db, 'capped', { detail: `${spent?.n} today` });
    return json({ ok: false, why: 'daily cap' });
  }

  const style = String(body?.style || pick(STYLES));
  const town = String(body?.town || pick(TOWNS));

  if (body?.wait) return spawn(env, db, body, style, town);

  const work = spawn(env, db, body, style, town)
    .then(async (r) => console.log('Spawn finished:', style, town, (await r.clone().text()).slice(0, 200)))
    .catch((e) => console.error('Spawn failed:', e));
  if (ctx?.waitUntil) ctx.waitUntil(work);
  return json({ ok: true, queued: true, style, town });
};

async function spawn(
  env: any, db: any, body: any, style: string, town: string
): Promise<Response> {
  try {
    const apiKey = env.ANTHROPIC_API_KEY;

    if (!apiKey) return json({ error: 'no key' }, 503);

    const wantReal = body?.real ?? Math.random() < REAL_ODDS;

    // Work out what pictures are left before spending anything on words. A
    // style whose pool is used up cannot produce a site worth publishing, and
    // finding that out after the model has written one wastes the run.
    //
    // Only the invented path draws on the pool. A real business brings its own
    // photographs, so gating it on our stock was turning away the runs that
    // needed no stock at all — a Masterton physio was refused for want of
    // physio pictures it was never going to use.
    const claimedPhotos = await spokenFor(db);
    const spare = (s: string) =>
      (PHOTOS[s] || []).filter((id) => !claimedPhotos.has(id)).length;

    if (!wantReal && spare(style) < MIN_PHOTOS) {
      // The caller pinned this style, so tell them plainly rather than quietly
      // building something else.
      if (body?.style) {
        await note(db, 'dry', { style, town, detail: `pinned style has ${spare(style)} free` });
        return json({ ok: false, why: `no unused photos left for ${style}`, spare: spare(style) });
      }
      const open = STYLES.filter((s) => spare(s) >= MIN_PHOTOS);
      if (!open.length) {
        await note(db, 'dry', { style, town, detail: 'every style is out of photos' });
        return json({ ok: false, why: 'every style is out of unused photos' });
      }
      style = pick(open);
    }

    // ── The real path ──────────────────────────────────────────────────
    if (wantReal) {
      try {
        // Given a url, skip the search: this is a rebuild of one we already
        // know about, usually because the first attempt produced a shell.
        const pinned = String(body?.url || '').trim();
        const found = pinned ? null : await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey,
                     'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: MODEL, max_tokens: 400, system: FIND,
            tools: [{ type: 'web_search_20260209', name: 'web_search',
                      allowed_callers: ['direct'], max_uses: 3,
                      user_location: { type: 'approximate', country: 'NZ' } }],
            messages: [{ role: 'user',
              content: `Find ${WHAT[style] || 'a small business'} in ${town}. Its own website only.` }],
          }),
        });
        if (pinned || (found && found.ok)) {
          const fd = found ? ((await found.json()) as any) : {};
          const said = (fd?.content || []).filter((c: any) => c?.type === 'text')
            .map((c: any) => c.text).join('');
          const hit = said ? said.match(/\{[\s\S]*?\}/) : null;
          const url = pinned || (hit ? (JSON.parse(hit[0])?.url || null) : null);

          if (url && /^https?:\/\//.test(url)) {
            const rebuilding = String(body?.rebuild || '').trim();
            const already = rebuilding
              ? null
              : await db.prepare('SELECT slug FROM site_claims WHERE source_url = ?')
                  .bind(url).first();
            if (!already) {
              const sc = await fetch('https://garage.co.nz/api/scrape', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
              });
              const d = sc.ok ? ((await sc.json()) as any) : null;
              const photos = [...new Set([...(d?.candidateImages || []), ...(d?.galleryImages || [])])]
                .filter((u: any) => typeof u === 'string' && /^https?:\/\//.test(u)
                  && !/logo|favicon|icon|sprite|badge|placeholder|filler|spacer/i.test(u.split('?')[0])
                  && /\.(jpe?g|webp|avif)/i.test(u.split('?')[0]))
                .slice(0, 12) as string[];

              // Only worth taking if it is actually richer than what we would
              // have written. Four photographs and a phone number is the bar.
              if (photos.length >= 4 && d?.phone) {
                // Hand the scrape to the model and let it write the page, the
                // same as the invented path does. Mapping fields by hand is
                // what produced the shells.
                const source = [
                  `Business name from the page title: ${d.title || ''}`,
                  d.description ? `Description: ${d.description}` : '',
                  d.tagline ? `Tagline: ${d.tagline}` : '',
                  d.address ? `Address: ${d.address}` : '',
                  (d.services || []).length ? `Services listed:\n${(d.services || []).slice(0, 20).map((x: any) => `  - ${String(x).slice(0, 160)}`).join('\n')}` : '',
                  d.aboutText ? `About, in their words:\n${String(d.aboutText).slice(0, 3000)}` : '',
                ].filter(Boolean).join('\n\n').slice(0, 8000);

                const wrote = await fetch('https://api.anthropic.com/v1/messages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey,
                             'anthropic-version': '2023-06-01' },
                  body: JSON.stringify({
                    model: MODEL, max_tokens: outFor(style),
                    system: [{ type: 'text', text: REWRITE, cache_control: { type: 'ephemeral' } }],
                    messages: [{ role: 'user',
                      content: `This is ${WHAT[style] || 'a small business'} in ${town}.\n\n${source}` }],
                  }),
                });
                if (!wrote.ok) {
                  await note(db, 'error', { style, town, detail: `rewrite HTTP ${wrote.status}` });
                  throw new Error('rewrite failed');
                }
                const wd = (await wrote.json()) as any;
                const wtext = (wd?.content || []).filter((c: any) => c?.type === 'text')
                  .map((c: any) => c.text).join('');
                const wmatch = wtext.match(/\{[\s\S]*\}/);
                if (!wmatch) {
                  await note(db, 'error', { style, town, detail: 'rewrite returned no json' });
                  throw new Error('no json');
                }
                const real: any = JSON.parse(wmatch[0]);

                // Their real details win over anything the model produced, and
                // a page title of "Home" is not a business name.
                const junk = /^(home|welcome|index|untitled|home page)$/i;
                if (!real.name || junk.test(String(real.name).trim())) {
                  real.name = String(fd?.name || '').trim()
                    || new URL(url).hostname.replace(/^www\./, '').split('.')[0];
                }
                real.style = style;
                real.tone = style === 'trade' ? 'dark' : 'light';
                real.shop = false; real.chat = false; real.products = [];
                real.contact = { phone: d.phone || '', email: d.email || '', address: d.address || '' };
                real.heroImage = photos[0];
                real.images = photos.slice(1);
                real.sections = [...(Array.isArray(real.sections) ? real.sections : []),
                  { type: 'gallery', label: 'Gallery', title: 'Have a look', images: photos.slice(1) }];

                // The same bar the invented ones clear. A held shell is worse
                // than no site: it wastes the review it is waiting for.
                const rscore = quality(real);
                if (rscore < 14) {
                  await note(db, 'rejected', { style, town,
                    detail: `real page too thin, score ${rscore} — ${url}` });
                  throw new Error('too thin');
                }

                let rslug = slugify(real.name) || slugify(new URL(url).hostname.split('.')[0]);
                if (rebuilding) {
                  // Replace the shell in place, and keep whatever address it
                  // already had so nothing that points at it breaks.
                  await db.prepare('DELETE FROM site_claims WHERE slug = ?').bind(rebuilding).run();
                  rslug = rebuilding;
                } else {
                  for (let i = 0; i < 25; i++) {
                    const taken = await db.prepare('SELECT 1 FROM site_claims WHERE slug = ?')
                      .bind(rslug).first();
                    if (!taken) break;
                    rslug = (slugify(real.name) || 'biz').slice(0, 30) + (i + 2);
                  }
                }
                // Disabled and unstarred. Nothing of theirs is visible anywhere
                // until somebody looks at it and stars it.
                await db.prepare(
                  `INSERT INTO site_claims (slug, email, source_url, config, status, edit_token,
                                            in_projects, updated_at, created_at)
                   VALUES (?, ?, ?, ?, 'disabled', ?, 0, datetime('now'), datetime('now'))`
                ).bind(rslug, d?.email || `${rslug}@garage.co.nz`, url,
                       JSON.stringify(real), token()).run();

                const u2 = fd?.usage || {};
                await db.prepare(
                  `INSERT INTO agent_usage (id, slug, model, steps, input_tokens, output_tokens,
                                            cache_read, cache_write, message_chars, created_at)
                   VALUES (?, ?, ?, 1, ?, ?, ?, ?, -1, ?)`
                ).bind(crypto.randomUUID(), rslug, MODEL, u2.input_tokens || 0,
                       u2.output_tokens || 0, u2.cache_read_input_tokens || 0,
                       u2.cache_creation_input_tokens || 0, new Date().toISOString()).run();

                await note(db, 'held', { style, town, slug: rslug, detail: `real: ${url}` });
                return json({ ok: true, real: true, held: true, slug: rslug, style, town,
                              photos: photos.length, name: real.name, source: url });
              }
            }
          }
        }
      } catch (error) {
        console.error('Real path failed, writing one instead:', error);
      }
      // Fall through and invent one rather than waste the hour.
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey,
                 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL, max_tokens: outFor(style),
        system: [{ type: 'text', text: WRITE, cache_control: { type: 'ephemeral' } }],
        messages: [{
          role: 'user',
          content:
            `Town: ${town}\nBusiness: ${WHAT[style] || 'a small business'}\n` +
            `This page must include ${MUST[style]?.say || 'services and opening hours'}.` +
            (MUST[style]?.sections.length
              ? ` Use these section types: ${MUST[style].sections.join(', ')}.`
              : '') +
            (style === 'yoga' || style === 'pilates'
              ? ' The timetable goes in a menu section: one group per day of the week, each item' +
                ' a class with the time in "price", the class name in "name" and the teacher in "text".'
              : '') +
            (style === 'workshop'
              ? ' Classes go in a menu section. Write each "text" as parts split by a middle dot,' +
                ' like "3 hours \u00b7 max 6 \u00b7 you take home a textured silver ring" — the last' +
                ' part must always say what the person carries out of the door. Put the firing or' +
                ' collection wait in specs and again in faq. A spec value is a number or a' +
                ' couple of words — "3–4 weeks", "6" — never a sentence.'
              : '') +
            (style === 'rugby' || style === 'soccer' || style === 'basketball'
              ? ' Grades go in a menu section: the grade in "name" and the age band in "price",' +
                ' like "Rippa" priced "5\u20137 years". Sponsors go in a section with a partners' +
                ' array of invented local businesses. Subs go in rates. Training nights go in' +
                ' hours. Do not invent a fixture list.'
              : '') +
            (style === 'charity'
              ? ' The menu section is amounts against real things: the dollar figure in "price"' +
                ' and what it buys in "name", like "$30" buying "Batteries for a monitoring' +
                ' device". Never write vague good works. The rates section is where the money' +
                ' goes, each item a destination and a percentage. Put an invented registration' +
                ' in credentials as "Registered charity" with a CC number.'
              : '') +
            (style === 'townhall'
              ? ' Rooms go in a menu section and the rate is two numbers slash-separated with the' +
                ' community rate first, like "$30 / $40". Specs are capacity by layout — seated' +
                ' dinner, standing, theatre. Credentials are what comes with it, specifically:' +
                ' the tables and chairs, the zip, the dishwasher, the oven, the PA. Conditions' +
                ' are the bond and the curfew.'
              : '') +
            (style === 'daycare'
              ? ' Fees go in a menu section banded by age, the name written "age | room" like' +
                ' "Under 2 | P\u0113pi room" with the weekly fee in price. Under-2s are the' +
                ' expensive band; from 3 the fee drops because 20 Hours ECE applies. The' +
                ' conditions section explains 20 Hours ECE exactly: 3, 4 and 5 year olds, up to' +
                ' 20 hours a week, no more than 6 hours a day, and no fee may be charged for' +
                ' those hours. Specs carry the ratios — 1:5 under two, 1:10 over two. Steps are' +
                ' the day, the clock first and the label second, like ["8am", "Arrival and free play"].'
              : '') +
            (style === 'sauna'
              ? ' The round goes in a steps section, in order, with times a first-timer can follow' +
                ' and both numbers (beginner and seasoned). Name the sauna or the ice in each step' +
                ' so it reads as hot or cold. Prices go in a menu section grouped into sessions' +
                ' priced per person, packs, and memberships. The conditions section is a plain' +
                ' safety note — get out if dizzy, do not get in unwell — never dressed up.' +
                ' Specs are four short numbers and nothing else: how hot the sauna runs,' +
                ' how cold the plunge is, how long a session lasts, how many fit.'
              : ''),
        }],
      }),
    });
    if (!res.ok) {
      await note(db, 'error', { style, town, detail: `model HTTP ${res.status}` });
      return json({ error: `model ${res.status}` }, 502);
    }
    const data = (await res.json()) as any;

    const text = (data?.content || []).filter((c: any) => c?.type === 'text')
      .map((c: any) => c.text).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      // The API's own words, when it has any. A run that fails because the
      // account is out of credit looked exactly like a run that fails because
      // the model wandered, and the log said the second thing for both — which
      // is how the whole spawner sat dead for hours reading as a bad reply.
      const why = (data as any)?.error?.message
        || ((data as any)?.stop_reason === 'max_tokens' ? 'cut off at the token limit' : '')
        || 'no json in the reply';
      await note(db, 'error', { style, town, detail: String(why).slice(0, 300) });
      return json({ error: why }, 502);
    }

    let cfg: any;
    try {
      cfg = JSON.parse(match[0]);
    } catch (e) {
      await note(db, 'error', {
        style, town,
        detail: `JSON.parse: ${String((e as Error)?.message || e).slice(0, 200)}`,
      });
      return json({ error: 'bad json back' }, 502);
    }
    if (!cfg?.name) {
      await note(db, 'error', { style, town, detail: 'no business name' });
      return json({ error: 'no name' }, 502);
    }

    // Pictures it can actually have. Stock, from a pool checked by hand — an
    // invented business with no photographs is a thin page, and thin is the one
    // thing this job is meant to avoid.
    // Only photographs nobody else has. Taking the whole pool was the bug:
    // every beauty site got all six beauty pictures, so the second one was a
    // duplicate of the first before it had finished being written.
    const free = [...(PHOTOS[style] || [])]
      .filter((id) => !claimedPhotos.has(id))
      .sort(() => Math.random() - 0.5)
      .slice(0, MAX_PHOTOS);
    if (free.length < MIN_PHOTOS) {
      await note(db, 'dry', { style, town, detail: `${free.length} free, needs ${MIN_PHOTOS}` });
      return json({ ok: false, why: `only ${free.length} unused photos left for ${style}` });
    }
    cfg.style = style;
    cfg.heroImage = shot(free[0]);
    cfg.images = free.slice(1).map((i) => shot(i));
    cfg.shop = false;
    cfg.chat = false;
    cfg.products = cfg.products || [];

    // The sections that make this kind of page worth having. Missing one is a
    // reject rather than a shrug — the whole point of the job is that what it
    // publishes is better than what a person would knock out in five minutes.
    const have = new Set((cfg.sections || []).map((x: any) => String(x?.type || '')));
    const missing = (MUST[style]?.sections || []).filter((t) => !have.has(t));
    const score = quality(cfg);
    if (missing.length) {
      await note(db, 'rejected', { style, town, detail: `missing ${missing.join(', ')} (score ${score})` });
      return json({ ok: false, why: 'missing ' + missing.join(', '), score });
    }
    if (score < 14) {
      await note(db, 'rejected', { style, town, detail: `too thin, score ${score}` });
      return json({ ok: false, why: 'too thin', score });
    }

    let slug = slugify(cfg.name) || 'biz' + Math.random().toString(36).slice(2, 7);
    for (let i = 0; i < 25; i++) {
      const taken = await db.prepare('SELECT 1 FROM site_claims WHERE slug = ?').bind(slug).first();
      if (!taken) break;
      slug = (slugify(cfg.name) || 'biz').slice(0, 30) + (i + 2);
    }

    await db.prepare(
      `INSERT INTO site_claims (slug, email, config, status, edit_token, in_projects, updated_at, created_at)
       VALUES (?, ?, ?, 'live', ?, 1, datetime('now'), datetime('now'))`
    ).bind(slug, `${slug}@garage.co.nz`, JSON.stringify(cfg), token()).run();

    // message_chars = -1 marks a spawn, so the daily cap can count its own runs
    // without tangling with the builder's rows.
    const used = data?.usage || {};
    await db.prepare(
      `INSERT INTO agent_usage (id, slug, model, steps, input_tokens, output_tokens,
                                cache_read, cache_write, message_chars, created_at)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, -1, ?)`
    ).bind(crypto.randomUUID(), slug, MODEL, used.input_tokens || 0, used.output_tokens || 0,
           used.cache_read_input_tokens || 0, used.cache_creation_input_tokens || 0,
           new Date().toISOString()).run();

    await note(db, 'made', { style, town, slug, detail: `${cfg.name} (score ${score})` });
    return json({ ok: true, slug, style, town, score, name: cfg.name });
  } catch (error) {
    console.error('Spawn failed:', error);
    await note(db, 'error', { style, town, detail: String((error as Error)?.message || error) });
    return json({ error: String((error as Error)?.message || error).slice(0, 160) }, 500);
  }
}
