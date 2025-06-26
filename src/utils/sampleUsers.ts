// Script to add sample admin users
// You can run this in the browser console or create a separate utility

const sampleUsers = [
  {
    nama_admin: "Budi G.",
    username: "budi",
    password: "budi777",
    role: "Admin"
  },
  {
    nama_admin: "Yoguntara S.",
    username: "yoguntara",
    password: "yoguntara777",
    role: "Admin"
  },
  {
    nama_admin: "Anggi A. P.",
    username: "anggi",
    password: "anggi777",
    role: "Admin"
  },
  {
    nama_admin: "Tiara R. R",
    username: "tiara",
    password: "tiara777",
    role: "Admin"
  },
  {
    nama_admin: "M. Reza A.",
    username: "reza",
    password: "reza777",
    role: "Admin"
  }
];

// Function to create all sample users
async function createSampleUsers() {
  const baseURL = 'https://api.laporaabupati.com';
  
  for (const user of sampleUsers) {
    try {
      const response = await fetch(`${baseURL}/userLogin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      });
      
      if (response.ok) {
        console.log(`✅ User ${user.nama_admin} created successfully`);
      } else {
        console.error(`❌ Failed to create user ${user.nama_admin}:`, await response.text());
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.nama_admin}:`, error);
    }
  }
}

// Uncomment to run
// createSampleUsers();

export { sampleUsers, createSampleUsers };
