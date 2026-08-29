// VIDEO MAP TEMPLATE (style: "videomap")
//
// A trip, told on the map it happened on.
//
// Every stop is a place with a photograph or a film attached, laid out on the
// coastline in the order they were visited and joined by a dashed line, so the
// shape of the journey is readable before a word is.
//
// The map is an inline SVG, not tiles. A tile map means a third-party request
// per square, a grey slab that ignores the site's colours, and somebody else's
// branding on a family holiday. This is Natural Earth's 1:50m coastline —
// public domain — projected once and pasted in, so the page draws its own
// country, in its own colours, with no network call at all.
//
// Positions are Web Mercator, the same projection every map you have ever
// looked at uses, so a pin sits where the place sits.

import type { SiteConfig, SiteSection } from './site-render';

export const VIDEOMAP_FONT_QUERY = '&family=Space+Grotesk:wght@400;500;700';

function esc(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)
  );
}

// The projection, fixed at the moment the path above was generated. Changing
// any of these three without regenerating the path moves every pin off the
// coast, so they travel together.
const VIEW_W = 1000;
const VIEW_H = 1414.4;
const LON0 = 166.477637;
const MERC_Y1 = -36.710252;
const SCALE = 82.928415;

export const NZ_VIEWBOX = `0 0 ${VIEW_W} ${VIEW_H}`;
export const NZ_PATH = 'M550.5 720.4L560.0 721.0L568.9 712.9L578.0 706.3L587.5 700.9L602.1 688.5L605.9 686.6L615.3 684.3L619.4 681.3L624.0 680.6L619.9 688.0L614.7 690.5L613.9 693.1L616.8 697.4L612.2 703.3L612.4 710.8L607.1 719.6L615.3 716.0L618.3 710.3L616.7 707.0L620.3 700.6L625.8 697.6L623.6 692.8L623.8 688.9L630.5 690.3L633.9 690.2L636.5 688.7L641.4 688.1L642.4 692.3L648.9 691.8L646.5 697.2L641.5 703.5L640.4 707.3L632.4 713.6L627.0 716.3L635.3 717.0L647.3 708.5L654.5 701.1L654.3 710.4L648.5 718.8L643.5 724.1L637.9 725.7L632.3 730.0L629.6 737.0L629.9 741.7L631.5 745.4L637.2 751.7L630.8 763.8L637.9 762.2L641.8 764.5L647.3 771.5L644.0 779.6L641.7 783.7L627.7 800.7L621.7 809.4L614.5 814.9L614.6 824.0L610.5 830.7L589.8 853.5L586.1 858.4L569.7 894.9L559.2 910.2L553.2 915.5L546.9 919.7L531.7 927.0L525.0 935.3L517.5 942.3L509.7 943.8L510.0 946.9L515.0 948.6L518.9 953.2L516.0 958.3L510.4 961.6L504.6 962.5L501.6 965.8L515.5 963.4L519.4 966.1L520.1 971.8L521.5 976.9L524.9 983.7L536.5 988.0L547.0 990.0L549.0 993.1L550.6 1003.9L548.7 1009.3L546.3 1012.8L542.8 1014.0L534.3 1014.7L525.8 1012.2L520.1 1005.7L504.0 1007.8L499.7 1009.2L497.4 1008.0L506.4 1001.1L501.7 997.2L497.8 995.8L493.6 998.0L490.8 1001.6L489.9 1007.6L487.0 1011.0L482.6 1012.0L476.3 1007.1L470.1 1000.0L460.9 992.9L462.3 997.3L469.3 1008.1L472.9 1015.2L464.7 1020.9L456.1 1025.4L448.9 1028.0L442.1 1032.1L434.1 1038.5L429.7 1040.7L418.0 1040.9L411.7 1042.9L409.7 1051.3L405.3 1056.7L395.0 1057.7L398.7 1059.4L401.0 1062.1L394.2 1087.6L392.7 1098.2L391.4 1116.3L387.2 1133.2L375.0 1133.1L376.9 1136.1L386.2 1140.9L384.4 1148.1L374.3 1161.3L370.0 1168.9L365.9 1187.5L359.7 1204.6L350.2 1224.2L350.1 1227.7L353.5 1232.7L357.5 1237.1L357.7 1243.2L356.5 1246.4L352.0 1247.3L348.0 1249.4L326.9 1254.8L319.9 1260.8L314.2 1271.7L307.5 1281.0L285.3 1301.8L272.3 1319.3L269.6 1324.3L266.1 1328.0L237.6 1336.3L217.4 1337.5L206.3 1335.4L195.7 1331.2L189.8 1329.8L178.6 1332.3L173.7 1335.2L164.9 1332.4L157.9 1334.5L155.9 1332.4L153.3 1327.3L154.7 1320.4L152.8 1315.4L148.3 1312.0L145.3 1308.0L141.9 1305.2L132.7 1304.1L118.0 1305.8L113.1 1305.7L103.2 1289.0L99.9 1284.9L88.1 1279.6L84.0 1280.3L77.7 1289.2L73.9 1290.7L51.6 1291.6L29.3 1288.8L21.1 1285.5L19.4 1277.8L36.4 1256.7L31.4 1259.5L21.0 1268.1L14.3 1266.8L20.7 1257.4L21.2 1253.2L19.9 1248.6L11.2 1256.5L1.3 1257.5L0.0 1250.2L0.9 1241.8L2.9 1239.4L29.7 1234.9L39.4 1232.0L43.6 1227.5L27.6 1226.0L26.5 1219.6L28.9 1214.6L42.6 1206.1L32.5 1208.3L21.3 1207.5L22.0 1198.6L24.9 1191.7L36.7 1191.5L33.0 1186.7L32.5 1180.1L35.7 1179.6L47.6 1188.6L56.2 1191.8L52.6 1185.1L53.1 1180.9L55.4 1179.0L62.4 1177.6L60.5 1176.4L53.9 1174.7L46.0 1169.6L45.2 1164.2L45.5 1158.0L53.9 1149.4L58.9 1154.5L64.8 1153.1L60.3 1149.1L57.6 1143.1L59.5 1139.2L77.4 1123.3L82.0 1138.6L83.1 1133.5L83.3 1128.7L81.2 1124.5L81.5 1120.3L83.5 1116.7L91.2 1113.2L101.2 1101.5L108.6 1096.1L114.6 1099.6L118.7 1104.3L118.1 1099.6L115.2 1095.8L114.4 1085.2L127.8 1068.7L142.5 1053.0L156.6 1036.7L164.2 1030.7L180.2 1024.0L190.5 1026.8L193.1 1026.3L208.4 1014.5L214.7 1011.5L220.4 1015.7L224.0 1017.2L220.4 1006.5L223.2 1001.6L236.0 992.9L251.9 984.0L264.0 980.2L273.0 974.2L278.3 974.0L277.5 969.5L278.4 965.1L283.0 965.4L284.5 963.7L280.4 961.3L293.6 952.6L300.7 943.0L304.4 941.0L307.8 938.1L312.0 931.5L317.0 929.3L321.6 930.3L325.0 933.6L323.1 928.2L317.2 925.1L323.6 920.4L330.1 917.2L336.5 919.5L342.8 923.3L336.5 917.5L335.5 913.9L343.1 909.8L347.3 908.5L353.1 916.3L352.3 910.1L353.6 904.6L361.8 895.7L372.5 881.0L376.0 886.1L376.5 892.4L376.0 899.9L378.2 897.3L379.0 890.4L377.3 878.5L390.8 856.5L393.4 854.0L396.3 852.5L401.0 851.9L399.6 848.6L396.0 845.4L399.6 834.2L401.8 821.5L404.9 809.3L409.9 797.4L415.4 777.5L419.5 773.4L430.8 772.0L435.7 769.2L443.9 762.0L453.7 749.1L458.9 738.7L465.7 711.8L469.5 683.9L480.6 663.2L496.8 648.3L511.1 636.9L516.9 634.6L526.8 633.8L536.2 637.0L518.7 639.7L516.9 646.4L516.4 653.3L518.4 659.4L521.6 664.8L530.0 669.9L539.9 673.0L544.4 684.6L545.2 698.3L546.6 710.1L550.5 720.4Z M563.2 51.0L564.5 55.6L569.1 52.3L572.5 47.1L578.0 41.9L577.3 50.4L580.1 52.2L598.4 58.2L602.2 63.1L606.1 64.5L608.3 61.8L610.9 60.3L617.5 63.4L632.4 72.1L633.7 75.1L632.9 79.5L633.7 84.3L635.7 88.0L640.7 88.9L647.3 83.3L650.4 82.6L654.8 90.5L656.4 95.0L655.7 94.8L658.6 99.3L662.4 103.7L668.9 116.7L667.9 121.3L666.0 125.4L672.0 137.5L668.1 138.3L656.2 136.3L656.6 138.7L663.5 147.6L669.3 160.1L674.0 167.7L690.3 191.2L687.9 199.6L688.3 205.2L686.2 209.9L691.8 222.5L688.3 226.3L685.9 239.2L683.4 241.5L683.7 246.2L690.3 247.4L694.3 249.4L697.7 253.2L699.9 248.6L702.8 247.4L710.6 253.5L727.1 259.6L731.6 261.9L733.8 266.9L735.5 278.9L738.7 284.1L745.0 285.2L751.7 283.6L753.9 279.2L752.5 267.5L747.6 248.7L747.6 242.6L748.3 236.5L747.2 230.5L744.7 224.7L742.1 220.4L738.7 216.7L739.9 211.0L745.0 208.4L748.0 213.2L750.5 219.1L763.3 236.4L770.8 235.2L771.5 242.4L776.6 249.7L779.4 258.2L783.1 283.9L788.9 308.1L799.2 318.7L800.4 323.8L794.1 321.2L792.2 322.7L792.8 325.3L798.7 329.9L805.5 332.2L809.8 331.9L813.9 333.6L840.7 349.4L853.5 355.6L886.0 365.7L895.3 366.5L900.5 366.2L910.2 362.7L918.9 356.4L926.4 347.0L932.9 336.2L940.0 331.0L948.0 326.9L952.0 323.2L956.3 320.5L978.1 321.7L985.4 327.1L995.0 331.4L1000.0 334.8L998.3 341.7L992.6 351.9L988.2 363.0L984.3 388.3L981.7 414.0L977.7 425.4L970.5 434.1L962.6 440.5L953.6 443.5L949.9 458.2L948.1 475.5L948.6 479.8L951.5 483.2L952.7 488.3L948.0 498.7L945.2 497.2L941.3 488.6L937.8 485.0L927.0 482.3L916.0 481.0L906.4 481.8L897.2 485.5L883.3 493.0L879.0 496.8L875.2 501.7L868.8 512.5L867.3 525.7L867.6 532.6L869.8 538.0L881.7 545.3L869.9 570.9L859.5 597.7L853.6 605.4L846.8 612.4L840.4 628.6L829.2 642.6L821.6 653.2L815.7 664.3L810.6 676.1L799.5 692.9L794.6 703.9L788.3 713.1L776.4 724.9L763.7 735.0L743.8 749.1L738.3 753.7L732.4 757.1L725.2 753.1L723.7 748.7L722.1 739.2L720.5 735.7L711.2 732.8L699.0 737.4L696.9 736.4L696.4 734.2L696.4 720.3L698.5 716.4L695.6 714.2L692.8 715.1L691.8 718.6L693.6 721.7L686.6 725.5L679.3 725.6L677.1 724.1L676.5 721.5L678.3 717.3L680.6 713.6L694.1 696.1L708.1 672.9L720.2 648.2L723.4 635.5L727.8 612.0L724.2 602.2L719.7 593.1L707.5 575.4L691.3 565.5L680.8 564.1L670.9 560.4L661.5 552.0L653.0 542.1L636.1 534.0L618.4 527.6L608.2 518.7L605.8 513.4L604.2 507.2L604.4 501.5L605.7 495.7L607.7 491.2L610.9 488.0L629.7 476.5L649.7 470.0L653.3 470.2L656.9 469.1L661.8 465.2L670.8 456.2L673.4 450.2L675.1 431.1L678.0 412.4L683.1 390.9L690.9 377.7L693.5 369.5L690.3 356.2L693.2 351.3L696.8 348.3L700.8 346.6L694.0 334.1L686.0 315.2L684.3 309.4L685.5 303.6L687.5 297.9L682.5 296.5L679.6 291.0L672.4 272.8L674.4 269.9L678.5 271.9L684.7 285.0L685.7 278.2L690.5 274.1L695.5 271.9L700.9 271.4L688.7 256.8L684.6 257.4L679.2 259.7L673.7 261.1L668.3 259.9L663.3 256.6L660.7 250.4L657.5 238.6L655.5 234.2L639.5 210.1L644.2 209.3L657.1 221.4L659.6 217.5L661.5 212.0L660.9 205.8L657.8 201.1L653.2 198.1L653.1 192.6L656.6 187.6L656.4 184.1L649.0 177.0L646.0 176.2L644.7 179.5L646.8 184.5L644.9 185.0L626.8 172.0L621.3 161.6L616.7 150.1L616.3 154.8L617.0 161.3L624.1 174.5L635.6 189.2L637.6 193.1L635.9 198.2L631.9 199.6L628.4 196.4L623.1 183.8L619.3 177.5L575.1 112.7L580.7 104.2L589.5 97.0L591.5 93.8L592.8 90.0L589.1 89.3L585.8 91.1L582.0 94.4L578.6 98.1L574.2 106.5L572.1 108.4L566.9 102.6L565.0 99.0L565.0 94.8L563.7 92.1L559.8 91.2L554.2 82.7L550.6 78.4L556.5 70.1L556.7 59.2L550.6 47.8L543.3 37.4L529.3 20.5L516.5 2.6L530.4 0.4L544.5 0.0L537.9 10.7L540.9 16.8L545.4 22.1L555.1 38.1L555.9 42.7L560.8 47.4L563.2 51.0Z M138.3 1365.5L138.3 1370.4L129.6 1368.6L129.8 1374.1L136.7 1376.9L139.2 1380.9L146.3 1379.7L147.9 1385.6L146.2 1390.8L141.5 1394.6L127.5 1396.6L118.4 1404.2L110.6 1403.0L108.4 1403.7L99.4 1411.9L89.3 1414.4L86.6 1413.8L88.0 1406.5L95.5 1399.6L95.6 1393.0L97.6 1387.7L104.8 1383.9L104.9 1377.0L109.7 1370.9L106.8 1357.7L108.3 1345.9L122.6 1345.2L138.3 1365.5Z M751.8 188.1L752.5 193.8L746.1 191.8L743.6 187.5L736.5 183.1L735.5 181.8L734.7 173.3L738.4 169.2L739.1 167.4L740.7 166.7L743.6 171.2L749.3 177.6L751.8 188.1Z M22.3 1220.8L21.8 1226.7L20.9 1229.6L18.0 1229.6L13.7 1229.0L9.5 1226.3L6.8 1227.1L4.5 1226.1L7.4 1219.5L17.2 1216.0L21.0 1218.8L22.3 1220.8Z';

/** Where a place lands on the map, in viewBox units. */
export function project(lat: number, lng: number): { x: number; y: number } {
  const my = (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) * 180) / Math.PI;
  return { x: (lng - LON0) * SCALE, y: (MERC_Y1 - my) * SCALE };
}

export type Stop = {
  name?: string;
  lat: number;
  lng: number;
  note?: string;
  yt?: string;
  img?: string;
};

const YT = /^[A-Za-z0-9_-]{11}$/;

/** Only stops that are on the map and have something to show. */
export function stopsOf(site: SiteConfig): Stop[] {
  const out: Stop[] = [];
  for (const section of site.sections || []) {
    for (const raw of ((section as any)?.stops || []) as Stop[]) {
      const lat = Number(raw?.lat);
      const lng = Number(raw?.lng);
      if (!isFinite(lat) || !isFinite(lng)) continue;
      // Anything outside the country would be drawn off the edge of the card.
      if (lat > -33 || lat < -48 || lng < 166 || lng > 179) continue;
      out.push({
        name: raw?.name || '',
        lat,
        lng,
        note: raw?.note || '',
        yt: YT.test(String(raw?.yt || '')) ? String(raw.yt) : '',
        img: /^https?:\/\//.test(String(raw?.img || '')) ? String(raw.img) : '',
      });
    }
  }
  return out.slice(0, 40);
}

export const VIDEOMAP_CSS = `
.vm{--room:#0a0b0d;--panel:#141519;--ink:#f4f5f7;--dim:#8b8d97;--line:#25262d;
--sea:#0d1013;--land:#1b1d23;--accent:var(--primary);
--display:'Space Grotesque','Space Grotesk',system-ui,sans-serif;
--body:'Inter',system-ui,-apple-system,sans-serif}
.vm{background:var(--room);color:var(--ink);font-family:var(--body);line-height:1.6}
html:has(body.vm),body.vm{background:var(--room)}
.vm h1,.vm h2{font-family:var(--display);font-weight:700;line-height:1.03;
letter-spacing:-.03em;text-align:left;margin-bottom:0}
.vm ::selection{background:var(--accent);color:#000}
.vm-wrap{max-width:80rem;margin:0 auto;padding:0 1.2rem}

.vm-head{padding:2.6rem 0 1.4rem}
.vm-eyebrow{font-size:.7rem;letter-spacing:.26em;text-transform:uppercase;color:var(--accent);
margin-bottom:.8rem}
.vm-head h1{font-size:clamp(2.1rem,6vw,3.8rem);max-width:17ch}
.vm-lede{margin-top:.9rem;max-width:36rem;color:var(--dim)}

/* -- The tour. Map on the left, whatever is at that stop on the right. -- */
.vm-tour{display:grid;gap:1rem;grid-template-columns:1fr;padding-bottom:3rem}
@media(min-width:900px){.vm-tour{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);
align-items:start}}

.vm-map{position:relative;background:var(--sea);border:1px solid var(--line);
border-radius:14px;padding:.8rem;overflow:hidden}
.vm-map svg{display:block;width:100%;height:auto;max-height:74vh;margin:0 auto}
.vm-coast{fill:var(--land);stroke:color-mix(in srgb,var(--accent) 45%,var(--line));
stroke-width:2.5;stroke-linejoin:round;vector-effect:non-scaling-stroke}
/* The order of the trip, drawn. It is the difference between pins on a map
   and a journey. */
.vm-route{fill:none;stroke:color-mix(in srgb,var(--accent) 70%,transparent);
stroke-width:2;stroke-dasharray:7 9;stroke-linecap:round;vector-effect:non-scaling-stroke;
opacity:.75}
.vm-pin{cursor:pointer}
.vm-pin circle{fill:var(--accent);stroke:#0a0b0d;stroke-width:3;
transition:r .18s cubic-bezier(.2,.8,.2,1)}
.vm-pin text{fill:#000;font-family:var(--display);font-weight:700;
text-anchor:middle;dominant-baseline:central;pointer-events:none}
.vm-pin:hover circle,.vm-pin:focus circle{r:26}
.vm-pin.on circle{fill:#fff;r:26}
.vm-pin:focus{outline:none}
.vm-pin.on text{fill:#000}

/* -- The panel. One stop at a time, given room. -- */
.vm-panel{background:var(--panel);border:1px solid var(--line);border-radius:14px;
overflow:hidden;position:sticky;top:1rem}
.vm-screen{position:relative;aspect-ratio:16/9;background:#000;display:block;width:100%}
.vm-screen img{width:100%;height:100%;object-fit:cover;display:block}
.vm-screen iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.vm-play{position:absolute;inset:0;display:grid;place-items:center;border:0;cursor:pointer;
background:linear-gradient(transparent 45%,rgba(0,0,0,.6));width:100%;height:100%;padding:0}
.vm-disc{width:3.6rem;height:3.6rem;border-radius:50%;background:rgba(0,0,0,.55);
border:1px solid rgba(255,255,255,.55);display:grid;place-items:center;transition:.18s}
.vm-disc:after{content:'';border-style:solid;border-width:.52rem 0 .52rem .9rem;
border-color:transparent transparent transparent #fff;margin-left:.18rem}
.vm-play:hover .vm-disc{transform:scale(1.08);background:var(--accent)}
.vm-play:hover .vm-disc:after{border-left-color:#000}
.vm-none{aspect-ratio:16/9;display:grid;place-items:center;color:var(--dim);font-size:.85rem;
background:repeating-linear-gradient(45deg,#141519,#141519 10px,#17181d 10px,#17181d 20px)}
.vm-say{padding:1rem 1.1rem 1.2rem}
.vm-say b{display:block;font-family:var(--display);font-weight:600;font-size:1.15rem;
letter-spacing:-.01em}
.vm-say i{display:block;font-style:normal;font-size:.72rem;letter-spacing:.18em;
text-transform:uppercase;color:var(--accent);margin-bottom:.35rem}
.vm-say p{color:var(--dim);font-size:.92rem;margin-top:.4rem}

/* -- Every stop, for anyone not using a mouse. -- */
.vm-list{margin-top:.9rem;display:grid;gap:2px}
.vm-stop{display:grid;grid-template-columns:1.6rem 1fr;gap:.6rem;align-items:baseline;
background:none;border:0;border-radius:8px;padding:.5rem .6rem;cursor:pointer;
text-align:left;color:var(--dim);font:inherit;font-size:.88rem;width:100%}
.vm-stop:hover{background:var(--panel);color:var(--ink)}
.vm-stop.on{background:var(--panel);color:var(--ink)}
.vm-stop b{font-family:var(--display);font-weight:700;color:var(--accent);font-size:.8rem}
.vm-stop.on b{color:var(--ink)}

.vm-end{padding:2.2rem 0 4rem;border-top:1px solid var(--line)}
.vm-credit{color:var(--dim);font-size:.86rem;max-width:42rem}
`;

/** The map itself: coastline, route, and a numbered pin for each stop. */
function mapSvg(stops: Stop[]): string {
  const pts = stops.map((s) => project(s.lat, s.lng));
  const route = pts.length > 1
    ? `<path class="vm-route" d="${pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('')}" />`
    : '';
  const pins = pts
    .map((p, i) => {
      const s = stops[i];
      const label = s.name || `Stop ${i + 1}`;
      return `<g class="vm-pin" data-i="${i}" tabindex="0" role="button"
        aria-label="${esc(label)}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})">
        <circle r="21"></circle>
        <text font-size="22">${i + 1}</text>
      </g>`;
    })
    .join('');

  return `<svg viewBox="${NZ_VIEWBOX}" role="img" aria-label="Map of New Zealand with the stops on it">
    <path class="vm-coast" d="${NZ_PATH}" />
    ${route}
    ${pins}
  </svg>`;
}

/** The right-hand panel for one stop. Films load on click, never before. */
function panel(stop: Stop, index: number, total: number): string {
  const screen = stop.yt
    ? `<div class="vm-screen" data-yt="${esc(stop.yt)}">
        <img src="https://i.ytimg.com/vi/${esc(stop.yt)}/maxresdefault.jpg" alt=""
             onerror="this.src='https://i.ytimg.com/vi/${esc(stop.yt)}/hqdefault.jpg'" />
        <button type="button" class="vm-play" aria-label="Play"><span class="vm-disc"></span></button>
      </div>`
    : stop.img
      ? `<div class="vm-screen"><img src="${esc(stop.img)}" alt="${esc(stop.name || '')}" /></div>`
      : `<div class="vm-none">Nothing at this stop yet</div>`;

  return `${screen}
    <div class="vm-say">
      <i>Stop ${index + 1} of ${total}</i>
      <b>${esc(stop.name || 'Somewhere in New Zealand')}</b>
      ${stop.note ? `<p>${esc(stop.note)}</p>` : ''}
    </div>`;
}

export function renderVideoMapBody(site: SiteConfig, slug: string): string {
  const who = site.name || slug;
  const stops = stopsOf(site);
  const section = (site.sections || []).find((s: SiteSection) => (s as any)?.stops?.length);

  if (!stops.length) {
    return `
<header class="vm-head"><div class="vm-wrap">
  ${site.eyebrow ? `<p class="vm-eyebrow">${esc(site.eyebrow)}</p>` : ''}
  <h1>${esc(site.headline || who)}</h1>
  <p class="vm-lede">No stops on the map yet. Add a place, a photo or a film, and it appears here.</p>
</div></header>`;
  }

  const list = stops
    .map(
      (s, i) => `<button type="button" class="vm-stop${i === 0 ? ' on' : ''}" data-i="${i}">
      <b>${i + 1}</b><span>${esc(s.name || 'Untitled stop')}</span>
    </button>`
    )
    .join('');

  return `
<header class="vm-head"><div class="vm-wrap">
  ${site.eyebrow ? `<p class="vm-eyebrow">${esc(site.eyebrow)}</p>` : ''}
  <h1>${esc(site.headline || who)}</h1>
  ${site.lede ? `<p class="vm-lede">${esc(site.lede)}</p>` : ''}
</div></header>

<section class="vm-wrap"><div class="vm-tour">
  <div class="vm-map">${mapSvg(stops)}</div>
  <div>
    <div class="vm-panel" id="vm-panel">${panel(stops[0], 0, stops.length)}</div>
    <div class="vm-list">${list}</div>
  </div>
</div></section>

<section class="vm-end"><div class="vm-wrap">
  <p class="vm-credit">${esc(section?.text || `${stops.length} stops, in the order they happened.`)}</p>
</div></section>

<script>
(function () {
  var STOPS = ${JSON.stringify(
    stops.map((s, i) => ({ i, name: s.name, note: s.note, yt: s.yt, img: s.img }))
  )};
  var panel = document.getElementById('vm-panel');
  if (!panel) return;
  var total = STOPS.length;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function show(i) {
    var s = STOPS[i];
    if (!s) return;
    var screen = s.yt
      ? '<div class="vm-screen" data-yt="' + esc(s.yt) + '">' +
          '<img src="https://i.ytimg.com/vi/' + esc(s.yt) + '/maxresdefault.jpg" alt="" ' +
          "onerror=\\"this.src='https://i.ytimg.com/vi/" + esc(s.yt) + "/hqdefault.jpg'\\" />" +
          '<button type="button" class="vm-play" aria-label="Play"><span class="vm-disc"></span></button>' +
        '</div>'
      : s.img
        ? '<div class="vm-screen"><img src="' + esc(s.img) + '" alt="' + esc(s.name || '') + '" /></div>'
        : '<div class="vm-none">Nothing at this stop yet</div>';

    panel.innerHTML = screen +
      '<div class="vm-say"><i>Stop ' + (i + 1) + ' of ' + total + '</i>' +
      '<b>' + esc(s.name || 'Somewhere in New Zealand') + '</b>' +
      (s.note ? '<p>' + esc(s.note) + '</p>' : '') + '</div>';

    [].forEach.call(document.querySelectorAll('.vm-pin'), function (p) {
      p.classList.toggle('on', Number(p.dataset.i) === i);
    });
    [].forEach.call(document.querySelectorAll('.vm-stop'), function (p) {
      p.classList.toggle('on', Number(p.dataset.i) === i);
    });
  }

  document.addEventListener('click', function (e) {
    // The film, once somebody asks for it. Never on load — a page of stops
    // would be a page of embeds.
    var play = e.target.closest ? e.target.closest('.vm-play') : null;
    if (play) {
      var screen = play.closest('.vm-screen');
      var id = screen && screen.dataset.yt;
      if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      f.title = 'Film';
      screen.innerHTML = '';
      screen.appendChild(f);
      return;
    }
    var hit = e.target.closest ? e.target.closest('.vm-pin, .vm-stop') : null;
    if (hit) show(Number(hit.dataset.i));
  });

  // A pin is a button, so it answers the keyboard like one.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = document.activeElement;
    if (el && el.classList && el.classList.contains('vm-pin')) {
      e.preventDefault();
      show(Number(el.dataset.i));
    }
  });

  show(0);
})();
</script>`;
}
