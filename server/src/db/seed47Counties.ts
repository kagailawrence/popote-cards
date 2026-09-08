import { pool } from '../config/db';

export interface CountySeedData {
  name: string;
  region: string;
  subCounties: string[];
}

export const KENYA_47_COUNTIES: CountySeedData[] = [
  // 1. Coast (6)
  {
    name: 'Mombasa',
    region: 'Coast',
    subCounties: ['Mvita (CBD)', 'Nyali', 'Changamwe', 'Jomvu', 'Kisauni', 'Likoni']
  },
  {
    name: 'Kwale',
    region: 'Coast',
    subCounties: ['Matuga (CBD)', 'Msambweni', 'Lunga Lunga', 'Kinango', 'Samburu']
  },
  {
    name: 'Kilifi',
    region: 'Coast',
    subCounties: ['Kilifi North (CBD)', 'Kilifi South', 'Malindi', 'Magarini', 'Kaloleni', 'Rabai', 'Ganze']
  },
  {
    name: 'Tana River',
    region: 'Coast',
    subCounties: ['Galole / Hola (CBD)', 'Garsen', 'Bura']
  },
  {
    name: 'Lamu',
    region: 'Coast',
    subCounties: ['Lamu Island (CBD)', 'Lamu West', 'Lamu East']
  },
  {
    name: 'Taita-Taveta',
    region: 'Coast',
    subCounties: ['Voi (CBD)', 'Wundanyi', 'Taveta', 'Mwatate']
  },

  // 2. North Eastern (3)
  {
    name: 'Garissa',
    region: 'North Eastern',
    subCounties: ['Garissa Township (CBD)', 'Balambala', 'Dadaab', 'Fafi', 'Ijara', 'Lagdera']
  },
  {
    name: 'Wajir',
    region: 'North Eastern',
    subCounties: ['Wajir East (CBD)', 'Eldas', 'Tarbaj', 'Wajir North', 'Wajir South', 'Wajir West']
  },
  {
    name: 'Mandera',
    region: 'North Eastern',
    subCounties: ['Mandera East (CBD)', 'Banissa', 'Lafey', 'Mandera North', 'Mandera South', 'Mandera West']
  },

  // 3. Eastern (8)
  {
    name: 'Marsabit',
    region: 'Eastern',
    subCounties: ['Marsabit Central (CBD)', 'Laisamis', 'Moyale', 'North Horr', 'Saku']
  },
  {
    name: 'Isiolo',
    region: 'Eastern',
    subCounties: ['Isiolo Town (CBD)', 'Garbatulla', 'Merti']
  },
  {
    name: 'Meru',
    region: 'Eastern',
    subCounties: ['Imenti North (Meru CBD)', 'Buuri', 'Central Imenti', 'Igembe Central', 'Igembe North', 'Igembe South', 'South Imenti', 'Tigania East', 'Tigania West']
  },
  {
    name: 'Tharaka-Nithi',
    region: 'Eastern',
    subCounties: ['Chuka (CBD)', 'Maara', 'Tharaka North', 'Tharaka South']
  },
  {
    name: 'Embu',
    region: 'Eastern',
    subCounties: ['Manyatta (Embu CBD)', 'Runyenjes', 'Mbeere North', 'Mbeere South']
  },
  {
    name: 'Kitui',
    region: 'Eastern',
    subCounties: ['Kitui Central (CBD)', 'Kitui Rural', 'Kitui South', 'Kitui East', 'Kitui West', 'Mwingi Central', 'Mwingi North', 'Mwingi West']
  },
  {
    name: 'Machakos',
    region: 'Eastern',
    subCounties: ['Machakos Town (CBD)', 'Mavoko (Athi River)', 'Kangundo', 'Kathiani', 'Matungulu', 'Mwala', 'Yatta', 'Masinga']
  },
  {
    name: 'Makueni',
    region: 'Eastern',
    subCounties: ['Wote (CBD)', 'Kaiti', 'Kibwezi East', 'Kibwezi West', 'Kilome', 'Makueni', 'Mbooni']
  },

  // 4. Central (5)
  {
    name: 'Nyandarua',
    region: 'Central',
    subCounties: ['Ol Kalou (CBD)', 'Kinangop', 'Kipipiri', 'Ndaragwa', 'Ol Joro Orok']
  },
  {
    name: 'Nyeri',
    region: 'Central',
    subCounties: ['Nyeri Town (CBD)', 'Kieni East', 'Kieni West', 'Mathira East', 'Mathira West', 'Mukurweini', 'Othaya', 'Tetu']
  },
  {
    name: 'Kirinyaga',
    region: 'Central',
    subCounties: ['Kerugoya (CBD)', 'Kutus', 'Gichugu', 'Kirinyaga Central', 'Kirinyaga East', 'Kirinyaga West', 'Mwea East', 'Mwea West', 'Ndia']
  },
  {
    name: 'Murang\'a',
    region: 'Central',
    subCounties: ['Murang\'a Town (CBD)', 'Gatanga', 'Kandara', 'Kangema', 'Kigumo', 'Maragua', 'Mathioya']
  },
  {
    name: 'Kiambu',
    region: 'Central',
    subCounties: ['Kiambu Town (CBD)', 'Thika Town', 'Ruiru', 'Juja', 'Kikuyu', 'Kabete', 'Limuru', 'Githunguri', 'Karuri (Banana)', 'Lari', 'Gatundu South', 'Gatundu North']
  },

  // 5. Rift Valley (14)
  {
    name: 'Turkana',
    region: 'Rift Valley',
    subCounties: ['Lodwar (CBD)', 'Turkana Central', 'Turkana East', 'Turkana North', 'Turkana South', 'Turkana West (Kakuma)', 'Loima']
  },
  {
    name: 'West Pokot',
    region: 'Rift Valley',
    subCounties: ['Kapenguria (CBD)', 'Kacheliba', 'Pokot South', 'Sigor']
  },
  {
    name: 'Samburu',
    region: 'Rift Valley',
    subCounties: ['Samburu Central (Maralal CBD)', 'Samburu East', 'Samburu North', 'Samburu West']
  },
  {
    name: 'Trans-Nzoia',
    region: 'Rift Valley',
    subCounties: ['Kitale (CBD)', 'Cherangany', 'Endebess', 'Kiminini', 'Kwanza', 'Saboti']
  },
  {
    name: 'Uasin Gishu',
    region: 'Rift Valley',
    subCounties: ['Ainabkoi (Eldoret CBD)', 'Kapseret', 'Kesses', 'Moiben', 'Soy', 'Turbo']
  },
  {
    name: 'Elgeyo-Marakwet',
    region: 'Rift Valley',
    subCounties: ['Keiyo North (Iten CBD)', 'Keiyo South', 'Marakwet East', 'Marakwet West']
  },
  {
    name: 'Nandi',
    region: 'Rift Valley',
    subCounties: ['Emgwen (Kapsabet CBD)', 'Aldai', 'Chesumei', 'Mosop', 'Nandi Hills', 'Tinderet']
  },
  {
    name: 'Baringo',
    region: 'Rift Valley',
    subCounties: ['Baringo Central (Kabarnet CBD)', 'Baringo North', 'Baringo South', 'Eldama Ravine', 'Mogotio', 'Tiaty']
  },
  {
    name: 'Laikipia',
    region: 'Rift Valley',
    subCounties: ['Laikipia East (Nanyuki CBD)', 'Laikipia North', 'Laikipia West (Nyahururu)']
  },
  {
    name: 'Nakuru',
    region: 'Rift Valley',
    subCounties: ['Nakuru Town East (CBD)', 'Nakuru Town West', 'Naivasha', 'Gilgil', 'Molo', 'Njoro', 'Rongai', 'Subukia', 'Bahati', 'Kuresoi North', 'Kuresoi South']
  },
  {
    name: 'Narok',
    region: 'Rift Valley',
    subCounties: ['Narok North (Narok Town CBD)', 'Narok East', 'Narok South', 'Narok West', 'Kilgoris', 'Emurua Dikirr']
  },
  {
    name: 'Kajiado',
    region: 'Rift Valley',
    subCounties: ['Kajiado Central (CBD)', 'Kajiado East (Kitengela)', 'Kajiado North (Ngong / Rongai)', 'Kajiado West', 'Kajiado South (Loitokitok)']
  },
  {
    name: 'Kericho',
    region: 'Rift Valley',
    subCounties: ['Ainamoi (Kericho CBD)', 'Belgut', 'Bureti', 'Kipkelion East', 'Kipkelion West', 'Sigowet-Soin']
  },
  {
    name: 'Bomet',
    region: 'Rift Valley',
    subCounties: ['Bomet Central (CBD)', 'Bomet East', 'Chepalungu', 'Konoin', 'Sotik']
  },

  // 6. Western (4)
  {
    name: 'Kakamega',
    region: 'Western',
    subCounties: ['Lurambi (Kakamega CBD)', 'Butere', 'Ikolomani', 'Khwisero', 'Likuyani', 'Lugari', 'Malava', 'Matungu', 'Mumias East', 'Mumias West', 'Navakholo', 'Shinyalu']
  },
  {
    name: 'Vihiga',
    region: 'Western',
    subCounties: ['Vihiga (Mbale CBD)', 'Emuhaya', 'Hamisi', 'Luanda', 'Sabatia']
  },
  {
    name: 'Bungoma',
    region: 'Western',
    subCounties: ['Kanduyi (Bungoma CBD)', 'Bumula', 'Kabuchai', 'Kimilili', 'Mt. Elgon', 'Sirisia', 'Tongaren', 'Webuye East', 'Webuye West']
  },
  {
    name: 'Busia',
    region: 'Western',
    subCounties: ['Matayos (Busia CBD)', 'Budalangi (Bunyala)', 'Butula', 'Funyula (Samia)', 'Nambale', 'Teso North', 'Teso South']
  },

  // 7. Nyanza (6)
  {
    name: 'Siaya',
    region: 'Nyanza',
    subCounties: ['Alego Usonga (Siaya CBD)', 'Bondo', 'Gem', 'Rarieda', 'Ugenya', 'Ugunja']
  },
  {
    name: 'Kisumu',
    region: 'Nyanza',
    subCounties: ['Kisumu Central (CBD)', 'Kisumu East', 'Kisumu West', 'Muhoroni', 'Nyakach', 'Nyando', 'Seme']
  },
  {
    name: 'Homa Bay',
    region: 'Nyanza',
    subCounties: ['Homa Bay Town (CBD)', 'Kabondo Kasipul', 'Karachuonyo', 'Kasipul', 'Mbita (Suba North)', 'Ndhiwa', 'Rangwe', 'Suba South']
  },
  {
    name: 'Migori',
    region: 'Nyanza',
    subCounties: ['Suna West (Migori CBD)', 'Awendo', 'Kuria East', 'Kuria West', 'Nyatike', 'Rongo', 'Suna East', 'Uriri']
  },
  {
    name: 'Kisii',
    region: 'Nyanza',
    subCounties: ['Nyaribari Chache (Kisii CBD)', 'Bobasi', 'Bomachoge Borabu', 'Bomachoge Chache', 'Bonchari', 'Kitutu Chache North', 'Kitutu Chache South', 'Nyaribari Masaba', 'South Mugirango']
  },
  {
    name: 'Nyamira',
    region: 'Nyanza',
    subCounties: ['West Mugirango (Nyamira CBD)', 'Borabu', 'Manga', 'Masaba North', 'North Mugirango']
  },

  // 8. Nairobi (1)
  {
    name: 'Nairobi',
    region: 'Nairobi',
    subCounties: [
      'Starehe (Nairobi CBD)',
      'Westlands',
      'Dagoretti North (Kilimani / Kileleshwa)',
      'Dagoretti South',
      'Lang\'ata',
      'Karen',
      'Kibra',
      'Roysambu',
      'Kasarani',
      'Ruaraka',
      'Embakasi South',
      'Embakasi North',
      'Embakasi Central',
      'Embakasi East',
      'Embakasi West',
      'Makadara',
      'Kamukunji',
      'Mathare'
    ]
  }
];

export async function seed47Counties() {
  console.log('[Seed] Seeding and verifying all 47 counties of Kenya...');

  // 1. Ensure all 8 regional hubs exist in print_regions
  const regions = [
    { name: 'Nairobi', contact: 'Kariuki Mwangi', phone: '0712345678', whatsapp: '254712345678', cost: 120, address: 'Kirinyaga Road, Nairobi CBD' },
    { name: 'Central', contact: 'Peter Githinji', phone: '0722114455', whatsapp: '254722114455', cost: 150, address: 'Kimathi Way, Nyeri' },
    { name: 'Coast', contact: 'Amina Hassan', phone: '0733889900', whatsapp: '254733889900', cost: 160, address: 'Digo Road, Mvita, Mombasa' },
    { name: 'Rift Valley', contact: 'David Kiprono', phone: '0721778899', whatsapp: '254721778899', cost: 150, address: 'Kenyatta Avenue, Nakuru' },
    { name: 'Western', contact: 'Grace Wamalwa', phone: '0725667788', whatsapp: '254725667788', cost: 150, address: 'Kenyatta Way, Kakamega' },
    { name: 'Nyanza', contact: 'Otieno Omondi', phone: '0711223344', whatsapp: '254711223344', cost: 150, address: 'Oginga Odinga Street, Kisumu' },
    { name: 'Eastern', contact: 'Faith Mutua', phone: '0720334455', whatsapp: '254720334455', cost: 150, address: 'Syokimau Avenue, Machakos' },
    { name: 'North Eastern', contact: 'Abdi Noor', phone: '0719887766', whatsapp: '254719887766', cost: 180, address: 'Kismayu Road, Garissa' }
  ];

  for (const r of regions) {
    await pool.query(
      `INSERT INTO print_regions (name, contact_person, phone, whatsapp_number, email, address, status, cost_per_card_kes)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
       ON CONFLICT (name) DO UPDATE SET
         contact_person = COALESCE(print_regions.contact_person, EXCLUDED.contact_person),
         phone = COALESCE(print_regions.phone, EXCLUDED.phone),
         whatsapp_number = COALESCE(print_regions.whatsapp_number, EXCLUDED.whatsapp_number),
         cost_per_card_kes = COALESCE(print_regions.cost_per_card_kes, EXCLUDED.cost_per_card_kes)`,
      [r.name, r.contact, r.phone, r.whatsapp, `${r.name.toLowerCase().replace(/\s+/g, '')}@printpartner.co.ke`, r.address, r.cost]
    );
  }

  const hubsRes = await pool.query('SELECT id, name FROM print_regions');
  const hubMap = new Map<string, string>();
  hubsRes.rows.forEach((h: any) => hubMap.set(h.name, h.id));

  let totalCounties = 0;
  let totalSubCounties = 0;

  for (const item of KENYA_47_COUNTIES) {
    const hubId = hubMap.get(item.region);

    // Insert or update county
    const countyRes = await pool.query(
      `INSERT INTO counties (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [item.name]
    );
    const countyId = countyRes.rows[0].id;
    totalCounties++;

    // Re-assign county exclusively to its designated print region hub
    if (hubId) {
      await pool.query('DELETE FROM county_print_regions WHERE county_id = $1', [countyId]);
      await pool.query(
        `INSERT INTO county_print_regions (county_id, print_region_id)
         VALUES ($1, $2)
         ON CONFLICT (county_id, print_region_id) DO NOTHING`,
        [countyId, hubId]
      );
    }

    // Insert or update sub-counties
    for (let i = 0; i < item.subCounties.length; i++) {
      const subName = item.subCounties[i];
      const isCbd = i === 0 || subName.toLowerCase().includes('cbd') || subName.toLowerCase().includes('town');
      const zone = isCbd ? 'cbd' : 'outskirts';

      await pool.query(
        `INSERT INTO sub_counties (county_id, name, zone)
         VALUES ($1, $2, $3)
         ON CONFLICT (county_id, name) DO UPDATE SET zone = EXCLUDED.zone`,
        [countyId, subName, zone]
      );
      totalSubCounties++;
    }
  }

  console.log(`[Seed] Successfully verified and seeded all ${totalCounties} counties of Kenya!`);
  console.log(`[Seed] Verified and synced ${totalSubCounties} sub-counties.`);

  const countCheck = await pool.query('SELECT count(*) FROM counties');
  const subCountCheck = await pool.query('SELECT count(*) FROM sub_counties');
  console.log(`[Seed] Total counties: ${countCheck.rows[0].count} | Total sub-counties: ${subCountCheck.rows[0].count}`);

  const distribution = await pool.query(`
    SELECT p.name as hub_name, count(cpr.county_id) as mapped_counties, string_agg(c.name, ', ' ORDER BY c.name) as county_list
    FROM print_regions p
    LEFT JOIN county_print_regions cpr ON cpr.print_region_id = p.id
    LEFT JOIN counties c ON c.id = cpr.county_id
    GROUP BY p.name
    ORDER BY mapped_counties DESC
  `);
  console.log('[Seed] Hub coverage distribution:', distribution.rows);
}

if (require.main === module) {
  seed47Counties().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

