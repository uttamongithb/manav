async function main() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYWUyYjBmOC0zNGRlLTQ0NjgtYmMwYS0xODEwZmVkNmViMGUiLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwidXNlcm5hbWUiOiJhZG1pbnRlc3QiLCJkaXNwbGF5TmFtZSI6IkFkbWluIFRlc3RlciIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3Nzk2MzE1OSwiZXhwIjoxNzc4NTY3OTU5fQ.a44q7mfQXvHO9b00fvCq5n4WeoJ-ik3UKMlCqqFIAV0';
  const response = await fetch('http://localhost:3001/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Status:', response.status);
  console.log('Body:', await response.text());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
