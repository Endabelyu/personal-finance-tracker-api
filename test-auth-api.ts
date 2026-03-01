import { auth } from './server/lib/auth';

console.log(Object.keys(auth.api).filter(k => k.toLowerCase().includes('sign')));
