import 'dotenv/config'

const url = 'https://customer-api.datadome.co/1.1/protection/trustedproxies';

const options = {method: 'GET', headers: {accept: '*/*', 'x-api-key': process.env.DATADOME_MANAGEMENT_KEY}};
const deleteOptions = {method: 'DELETE', headers: {'x-api-key': process.env.DATADOME_MANAGEMENT_KEY}};

const response = await fetch(url, options)
if (!response.ok) {
    const message = `An error has occured: ${response.status}`
    console.log(response)
    throw new Error(message)
} 

const json = await response.json()
const data = json.data.trusted_proxies

for(let i=0; i<data.length; i++) {
    let trusted = data[i]
    if (trusted.proxyTitle.includes('GCP ')) {
        let deleteUrl = `https://customer-api.datadome.co/1.1/protection/trustedproxies/${trusted.id}`;
        let r = await fetch(deleteUrl, deleteOptions)
        if (!r.ok) {
            console.log(r);
        }

    }
}
