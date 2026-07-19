process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
const url = 'https://wdzaigmtxazczzhaussm.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkemFpZ210eGF6Y3p6aGF1c3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MTMzMjgsImV4cCI6MjA5OTI4OTMyOH0.DPnlLbqAzh78nrGjtsbepOCuqwhq8UpVv0QxqssCUow';
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('gifts').select('*').limit(1);
  if (error) {
    console.error('Error fetching gifts:', error);
  } else {
    console.log('Columns in gifts:', Object.keys(data[0] || {}));
  }
}
run();
