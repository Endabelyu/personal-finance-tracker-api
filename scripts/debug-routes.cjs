const http = require('http');

http.get('http://localhost:5173/auth/register', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (data.includes('Cannot read properties of null')) {
      console.log('Register page has SSR error!');
      console.log(data);
    } else {
      console.log('Register page SSR OK. Error must be during hydration.');
    }
  });
});

http.get('http://localhost:5173/api/auth/session', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('API Session Error payload:', data);
  });
});
