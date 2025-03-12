import http from 'http';

const host = 'localhost';
const port = process.env.PORT || 3000;
const url = `http://${host}:${port}/api/status`;

console.log(`Checking Monniverse server at ${url}...`);

http.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => data += chunk);
  
  res.on('end', () => {
    console.log('=== Server Status ===');
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Response: ${data}`);
    console.log(`Server running at: http://${host}:${port}`);
  });
}).on('error', (err) => {
  console.error('=== Server Check Failed ===');
  console.error(`Cannot connect to ${url}`);
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

console.log('The script should now run from the correct location. Let me know if you see any output in the terminal!');