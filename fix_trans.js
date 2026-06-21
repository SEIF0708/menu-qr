const fs = require('fs');

const add = (f, obj) => {
  const p = 'src/lib/translations/' + f;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  d.landing = { ...d.landing, ...obj };
  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
};

add('en.json', { pricingPlanWaText: "Hello, I would like to subscribe to MenuFlow for my restaurant." });
add('fr.json', { pricingPlanWaText: "Bonjour, je voudrais m'abonner à MenuFlow pour mon restaurant." });
add('ar.json', { pricingPlanWaText: "مرحباً، أود الاشتراك في MenuFlow لمطعمي." });
