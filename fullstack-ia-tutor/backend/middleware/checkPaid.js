export default function checkPaid(req, res, next) {
  // Mode GRATUIT : on laisse passer tout le monde
  return next();
}


