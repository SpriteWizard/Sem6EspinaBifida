export async function getUserByEmail(email: any) {
  const res = await fetch(
    `https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/user/getUserbyEmail?email=${email}`,{
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
      }
    }
  );
  const data = await res.json();
  if (!data.items[0]) {
    return null;
  }
  return data.items[0];
}

export async function getUserById(id: number) {
  const candidateUrls = [
    `https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/user/getUserbyId?id_usuario=${id}`,
    `https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/user/getUserById?id_usuario=${id}`,
    `https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/user/getUserbyId?id=${id}`,
    `https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/user/getUserById?id=${id}`,
  ]

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Basic ' + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString('base64'),
        },
      })
      if (!res.ok) continue
      const data = await res.json()
      if (data?.items?.[0]) return data.items[0]
      if (data && typeof data === 'object' && !Array.isArray(data)) return data
    } catch {
      continue
    }
  }

  return null
}

export async function createUser(data: any) {
  const res = await fetch(
    "https://g53bc679c5acb2c-espinabd.adb.mx-queretaro-1.oraclecloudapps.com/ords/admin/user/addGoogleUser",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.DB_USER}:${process.env.DB_PASSWORD}`).toString("base64"),
      },
      body: JSON.stringify({
        email: data.email,
        provider: data.provider,
        passhash: data.password,
      }),
    }
  );
  console.log(res);
  if (res.ok) {
    console.log("Success");
    return true;
  }
  return false;
}
