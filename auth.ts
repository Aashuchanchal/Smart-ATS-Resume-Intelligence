import { NowRequest, NowResponse } from '@vercel/node';

let db: any = { user: null };

export default function handler(req: NowRequest, res: NowResponse) {
  if (req.method === 'POST') {
    const { email, password, designation } = req.body;
    if (email && password) {
      db.user = { email, designation, name: email.split('@')[0] };
      res.status(200).json(db.user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } else if (req.method === 'GET') {
    res.status(200).json(db.user);
  }
}