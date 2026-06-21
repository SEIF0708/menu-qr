const fs = require('fs');

const add = (f, obj) => {
  const p = 'src/lib/translations/' + f;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  d.landing = { ...d.landing, ...obj };
  fs.writeFileSync(p, JSON.stringify(d, null, 2), 'utf8');
};

add('en.json', { waMsgReferred: "Hello, I want to subscribe to MenuFlow for my restaurant. I have the referral code {{code}}, so my price is 250 DT." });
add('fr.json', { waMsgReferred: "Bonjour, je voudrais m'abonner à MenuFlow pour mon restaurant. J'ai le code de parrainage {{code}}, donc mon prix est de 250 DT." });
add('ar.json', { waMsgReferred: "مرحباً، أود الاشتراك في MenuFlow لمطعمي. لدي رمز الإحالة {{code}}، لذا فإن سعري هو 250 دينار تونسي." });
