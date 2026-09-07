import { pool } from '../config/db';

export const KENYA_47_COUNTIES = [
  // 1. Coast (6)
  { name: 'Mombasa', region: 'Coast', subCounties: ['Mvita (CBD)', 'Nyali', 'Changamwe', 'Kisauni', 'Likoni', 'Jomvu'] },
  { name: 'Kwale', region: 'Coast', subCounties: ['Matuga (CBD)', 'Msambweni', 'Lunga Lunga', 'Kinango'] },
  { name: 'Kilifi', region: 'Coast', subCounties: ['Kilifi North (CBD)', 'Kilifi South', 'Malindi', 'Magarini', 'Kaloleni', 'Rabai', 'Ganze'] },
  { name: 'Tana River', region: 'Coast', subCounties: ['Hola (CBD)', 'Garsen', 'Bura'] },
  { name: 'Lamu', region: 'Coast', subCounties: ['Lamu Island (CBD)', 'Lamu West', 'Lamu East'] },
  { name: 'Taita-Taveta', region: 'Coast', subCounties: ['Voi (CBD)', 'Wundanyi', 'Taveta', 'Mwatate'] },

  // 2. North Eastern (3)
  { name: 'Garissa', region: 'North Eastern', subCounties: ['Garissa Township (CBD)', 'Dadaab', 'Fafi', 'Ijara', 'Balambala', 'Lagdera'] },
  { name: 'Wajir', region: 'North Eastern', subCounties: ['Wajir East (CBD)', 'Wajir North', 'Wajir South', 'Wajir West', 'Eldas', 'Tarbaj'] },
  { name: 'Mandera', region: 'North Eastern', subCounties: ['Mandera East (CBD)', 'Mandera North', 'Mandera South', 'Mandera West', 'Banissa', 'Lafey'] },

  // 3. Eastern (8)
  { name: 'Marsabit', region: 'Eastern', subCounties: ['Marsabit Central (CBD)', 'Saku', 'Laisamis', 'North Horr', 'Moyale'] },
  { name: 'Isiolo', region: 'Eastern', subCounties: ['Isiolo Town (CBD)', 'Merti', 'Garbatulla'] },
  { name: 'Meru', region: 'Eastern', subCounties: ['Imenti North (Meru CBD)', 'Imenti South', 'Imenti Central', 'Buuri', 'Tigania East', 'Tigania West', 'Igembe South', 'Igembe Central', 'Igembe North'] },
  { name: 'Tharaka-Nithi', region: 'Eastern', subCounties: ['Chuka (CBD)', 'Tharaka North', 'Tharaka South', 'Maara'] },
  { name: 'Embu', region: 'Eastern', subCounties: ['Embu Town (CBD)', 'Manyatta', 'Runyenjes', 'Mbeere North', 'Mbeere South'] },
  { name: 'Kitui', region: 'Eastern', subCounties: ['Kitui Central (CBD)', 'Kitui Rural', 'Kitui West', 'Kitui East', 'Kitui South', 'Mwingi North', 'Mwingi Central', 'Mwingi West'] },
  { name: 'Machakos', region: 'Eastern', subCounties: ['Machakos Town (CBD)', 'Mavoko (Athi River)', 'Kathiani', 'Kangundo', 'Matungulu', 'Yatta', 'Masinga', 'Mwala'] },
  { name: 'Makueni', region: 'Eastern', subCounties: ['Wote (CBD)', 'Kaiti', 'Kibwezi East', 'Kibwezi West', 'Kilome', 'Makueni'] },

  // 4. Central (5)
  { name: 'Nyandarua', region: 'Central', subCounties: ['Ol Kalou (CBD)', 'Kinangop', 'Kipipiri', 'Ndaragwa', 'Ol Joro Orok'] },
  { name: 'Nyeri', region: 'Central', subCounties: ['Nyeri Town (CBD)', 'Tetu', 'Kieni', 'Mathira', 'Othaya', 'Mukurweini'] },
  { name: 'Kirinyaga', region: 'Central', subCounties: ['Kerugoya (CBD)', 'Kutus', 'Mwea', 'Gichugu', 'Ndia'] },
  { name: 'Murang\'a', region: 'Central', subCounties: ['Murang\'a Town (CBD)', 'Kigumo', 'Kandara', 'Gatanga', 'Maragua', 'Mathioya', 'Kangema'] },
  { name: 'Kiambu', region: 'Central', subCounties: ['Kiambu Town (CBD)', 'Thika Town', 'Ruiru', 'Kikuyu', 'Limuru', 'Juja', 'Githunguri', 'Kabete', 'Lari'] },

  // 5. Rift Valley (14)
  { name: 'Turkana', region: 'Rift Valley', subCounties: ['Lodwar (CBD)', 'Turkana Central', 'Turkana West (Kakuma)', 'Turkana East', 'Turkana North', 'Turkana South', 'Loima'] },
  { name: 'West Pokot', region: 'Rift Valley', subCounties: ['Kapenguria (CBD)', 'Sigor', 'Kacheliba', 'Pokot South'] },
  { name: 'Samburu', region: 'Rift Valley', subCounties: ['Maralal (CBD)', 'Samburu West', 'Samburu East', 'Samburu North'] },
  { name: 'Trans-Nzoia', region: 'Rift Valley', subCounties: ['Kitale (CBD)', 'Kiminini', 'Saboti', 'Cherangany', 'Endebess'] },
  { name: 'Uasin Gishu', region: 'Rift Valley', subCounties: ['Eldoret CBD (Ainabkoi)', 'Kapseret', 'Kesses', 'Moiben', 'Soy', 'Turbo'] },
  { name: 'Elgeyo-Marakwet', region: 'Rift Valley', subCounties: ['Iten (CBD)', 'Keiyo North', 'Keiyo South', 'Marakwet East', 'Marakwet West'] },
  { name: 'Nandi', region: 'Rift Valley', subCounties: ['Kapsabet (CBD)', 'Nandi Hills', 'Aldai', 'Chesumei', 'Emgwen', 'Mosop'] },
  { name: 'Baringo', region: 'Rift Valley', subCounties: ['Kabarnet (CBD)', 'Baringo Central', 'Baringo North', 'Baringo South', 'Eldama Ravine', 'Mogotio', 'Tiaty'] },
  { name: 'Laikipia', region: 'Rift Valley', subCounties: ['Nanyuki (CBD)', 'Nyahururu', 'Laikipia East', 'Laikipia West', 'Laikipia North'] },
  { name: 'Nakuru', region: 'Rift Valley', subCounties: ['Nakuru Town East (CBD)', 'Nakuru Town West', 'Naivasha', 'Gilgil', 'Molo', 'Njoro', 'Rongai', 'Subukia', 'Bahati', 'Kuresoi North', 'Kuresoi South'] },
  { name: 'Narok', region: 'Rift Valley', subCounties: ['Narok Town (CBD)', 'Narok North', 'Narok South', 'Narok East', 'Narok West', 'Kilgoris', 'Emurua Dikirr'] },
  { name: 'Kajiado', region: 'Rift Valley', subCounties: ['Kajiado Central (CBD)', 'Kitengela', 'Ngong', 'Ongata Rongai', 'Kajiado North', 'Kajiado East', 'Kajiado West', 'Kajiado South'] },
  { name: 'Kericho', region: 'Rift Valley', subCounties: ['Kericho Town (CBD)', 'Ainamoi', 'Belgut', 'Bureti', 'Kipkelion East', 'Kipkelion West', 'Soin/Sigowet'] },
  { name: 'Bomet', region: 'Rift Valley', subCounties: ['Bomet Central (CBD)', 'Bomet East', 'Chepalungu', 'Konoin', 'Sotik'] },

  // 6. Western (4)
  { name: 'Kakamega', region: 'Western', subCounties: ['Kakamega Town (Lurambi CBD)', 'Mumias East', 'Mumias West', 'Malava', 'Shinyalu', 'Ikolomani', 'Butere', 'Khwisero', 'Matungu', 'Navakholo', 'Likuyani', 'Lugari'] },
  { name: 'Vihiga', region: 'Western', subCounties: ['Mbale (CBD)', 'Vihiga', 'Sabatia', 'Hamisi', 'Luanda', 'Emuhaya'] },
  { name: 'Bungoma', region: 'Western', subCounties: ['Bungoma Town (Kanduyi CBD)', 'Webuye East', 'Webuye West', 'Kimilili', 'Sirisia', 'Tongaren', 'Bumula', 'Mt. Elgon', 'Kabuchai'] },
  { name: 'Busia', region: 'Western', subCounties: ['Busia Town (Matayos CBD)', 'Teso North', 'Teso South', 'Nambale', 'Butula', 'Funyula (Samia)', 'Budalangi (Bunyala)'] },

  // 7. Nyanza (6)
  { name: 'Siaya', region: 'Nyanza', subCounties: ['Siaya Town (Alego Usonga CBD)', 'Bondo', 'Rarieda', 'Gem', 'Ugenya', 'Ugunja'] },
  { name: 'Kisumu', region: 'Nyanza', subCounties: ['Kisumu Central (CBD)', 'Kisumu East', 'Kisumu West', 'Nyakach', 'Nyando', 'Muhoroni', 'Seme'] },
  { name: 'Homa Bay', region: 'Nyanza', subCounties: ['Homa Bay Town (CBD)', 'Mbita (Suba North)', 'Suba South', 'Ndhiwa', 'Rangwe', 'Karachuonyo', 'Kabondo Kasipul', 'Kasipul'] },
  { name: 'Migori', region: 'Nyanza', subCounties: ['Migori Town (Suna West CBD)', 'Suna East', 'Rongo', 'Awendo', 'Uriri', 'Nyatike', 'Kuria West', 'Kuria East'] },
  { name: 'Kisii', region: 'Nyanza', subCounties: ['Kisii Central (CBD)', 'Kitutu Chache North', 'Kitutu Chache South', 'Nyaribari Chache', 'Nyaribari Masaba', 'Bobasi', 'Bomachoge Borabu', 'Bomachoge Chache', 'South Mugirango', 'Bonchari'] },
  { name: 'Nyamira', region: 'Nyanza', subCounties: ['Nyamira Town (CBD)', 'Borabu', 'Manga', 'Masaba North', 'West Mugirango'] },

  // 8. Nairobi (1)
  { name: 'Nairobi', region: 'Nairobi', subCounties: ['CBD (Starehe)', 'Westlands', 'Kilimani / Dagoretti', 'Lang\'ata / Karen', 'Embakasi Central', 'Embakasi East', 'Embakasi West', 'Embakasi North', 'Embakasi South', 'Kasarani', 'Ruaraka', 'Roysambu', 'Kamukunji', 'Makadara', 'Kibra', 'Mathare'] }
];

export async function seed47Counties() {
  console.log('Seeding and verifying all 47 counties of Kenya...');

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

    // Insert county if not exists
    const countyRes = await pool.query(
      `INSERT INTO counties (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [item.name]
    );
    const countyId = countyRes.rows[0].id;
    totalCounties++;

    // Map county to print region in county_print_regions
    if (hubId) {
      await pool.query(
        `INSERT INTO county_print_regions (county_id, print_region_id)
         VALUES ($1, $2)
         ON CONFLICT (county_id, print_region_id) DO NOTHING`,
        [countyId, hubId]
      );
    }

    // Insert sub-counties if they do not exist
    for (let i = 0; i < item.subCounties.length; i++) {
      const subName = item.subCounties[i];
      const zone = (i === 0 || subName.toLowerCase().includes('cbd')) ? 'cbd' : 'outskirts';

      const existingSub = await pool.query(
        'SELECT id FROM sub_counties WHERE county_id = $1 AND name = $2',
        [countyId, subName]
      );

      if (existingSub.rows.length === 0) {
        await pool.query(
          'INSERT INTO sub_counties (county_id, name, zone) VALUES ($1, $2, $3)',
          [countyId, subName, zone]
        );
        totalSubCounties++;
      }
    }
  }

  console.log(`Successfully verified and seeded all ${totalCounties} counties of Kenya!`);
  console.log(`Verified sub-counties, added ${totalSubCounties} new sub-counties.`);

  const countCheck = await pool.query('SELECT count(*) FROM counties');
  console.log(`Total counties in database: ${countCheck.rows[0].count}`);

  const distribution = await pool.query(`
    SELECT p.name as hub_name, count(cpr.county_id) as mapped_counties, string_agg(c.name, ', ' ORDER BY c.name) as county_list
    FROM print_regions p
    LEFT JOIN county_print_regions cpr ON cpr.print_region_id = p.id
    LEFT JOIN counties c ON c.id = cpr.county_id
    GROUP BY p.name
    ORDER BY mapped_counties DESC
  `);
  console.log('Hub county coverage distribution:', distribution.rows);
}

if (require.main === module) {
  seed47Counties().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
