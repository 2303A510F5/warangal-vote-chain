// Edit this file to change candidate / service details.
// NOTE: profile text below is SAMPLE content for an academic demo. Replace with verified information before real use.
const mk = (focus, about, works) => ({ focus, about, works });

module.exports = {
  constituencies: ['Warangal West', 'Warangal East'],
  parties: { INC: 'Indian National Congress', BJP: 'Bharatiya Janata Party', BRS: 'Bharat Rashtra Samithi' },
  candidates: [
    // ---------- Warangal West ----------
    { id: 'c1', name: 'Naini Rajender Reddy', party: 'INC', constituency: 'Warangal West', serviceFrom: 2016, serviceTo: 2021,
      ...mk('Roads and public infrastructure',
        'Served the Warangal West constituency from 2016 to 2021 as a representative of the Indian National Congress, with a focus on strengthening basic civic infrastructure.',
        [['Road improvement', 'Prioritised repair and widening of internal roads in residential colonies.'],
         ['Drainage and sanitation', 'Supported new drainage lines to reduce water-logging during the monsoon.'],
         ['Street lighting', 'Pushed for LED street lights across main junctions for safer evenings.'],
         ['Public parks', 'Backed development of neighbourhood parks and walking tracks.']]) },
    { id: 'c2', name: 'Dasyam Vinay Bhasker', party: 'BRS', constituency: 'Warangal West', serviceFrom: 2011, serviceTo: 2016,
      ...mk('Drinking water and urban development',
        'Served the Warangal West constituency from 2011 to 2016 as a representative of Bharat Rashtra Samithi, concentrating on water supply and city development.',
        [['Drinking water supply', 'Worked on extending piped drinking water to more households.'],
         ['Urban development', 'Supported planned development works in growing neighbourhoods.'],
         ['Community halls', 'Promoted construction of community halls for local gatherings.'],
         ['Lake and tank care', 'Encouraged cleaning and protection of local water bodies.']]) },
    { id: 'c3', name: 'Rao Padma', party: 'BJP', constituency: 'Warangal West', serviceFrom: 2021, serviceTo: 2026,
      ...mk('Education, women welfare and outreach',
        'Serving the Warangal West constituency from 2021 to 2026 as a representative of the Bharatiya Janata Party, with emphasis on education and women-focused initiatives.',
        [['School upgrades', 'Supported better classrooms and sanitation in government schools.'],
         ['Women self-help groups', 'Encouraged training and micro-enterprise support for women groups.'],
         ['Health camps', 'Organised free health check-up camps in local wards.'],
         ['Public grievance days', 'Held regular meetings to hear and resolve citizen complaints.']]) },
    // ---------- Warangal East ----------
    { id: 'c4', name: 'Konda Surekha', party: 'INC', constituency: 'Warangal East', serviceFrom: 2016, serviceTo: 2021,
      ...mk('Welfare schemes and local development',
        'Served the Warangal East constituency from 2016 to 2021 as a representative of the Indian National Congress, focusing on welfare delivery and neighbourhood development.',
        [['Welfare outreach', 'Helped residents access government welfare and pension schemes.'],
         ['Housing support', 'Supported housing assistance for low-income families.'],
         ['Market improvement', 'Backed cleaner and better organised local markets.'],
         ['Skill training', 'Promoted skill-training sessions for local youth.']]) },
    { id: 'c5', name: 'Errabelli Pradeep Kumar Rao', party: 'BJP', constituency: 'Warangal East', serviceFrom: 2011, serviceTo: 2016,
      ...mk('Urban services and public works',
        'Served the Warangal East constituency from 2011 to 2016 as a representative of the Bharatiya Janata Party, with attention to urban services and public works.',
        [['Waste management', 'Supported door-to-door garbage collection in several wards.'],
         ['Public transport', 'Pushed for better bus connectivity to outer colonies.'],
         ['Water pipelines', 'Backed replacement of old water pipelines.'],
         ['Sports ground', 'Promoted a playground and sports facility for local youth.']]) },
    { id: 'c6', name: 'Nannapuneni Narender', party: 'BRS', constituency: 'Warangal East', serviceFrom: 2021, serviceTo: 2026,
      ...mk('City infrastructure and housing',
        'Serving the Warangal East constituency from 2021 to 2026 as a representative of Bharat Rashtra Samithi, focusing on city infrastructure and housing.',
        [['Junction development', 'Supported widening and beautification of busy junctions.'],
         ['Housing layouts', 'Promoted planned housing layouts with basic amenities.'],
         ['Digital services', 'Encouraged online access to municipal services.'],
         ['Green drive', 'Backed tree-plantation drives along main roads.']]) }
  ]
};
