import IPCIDR from "ip-cidr"
import 'dotenv/config'

/**
 * Get Data from Google Cloud json file
 * @returns json object
 */
async function fetchGoogleIpRanges() {
    const response = await fetch('https://www.gstatic.com/ipranges/cloud.json')

    if (!response.ok) {
        const message = `An error has occured: ${response.status}`
        throw new Error(message)
    }

    const ranges = await response.json()
    return ranges
}

/**
 * Returns cidr start and end from a ipvX Range
 * 
 * @param {*} data 
 * @returns array with start IP and end IP
 */
function fetchCidr(data) {
    let ipRange = data.ipv4Prefix ? data.ipv4Prefix : data.ipv6Prefix

    if (!IPCIDR.isValidCIDR(ipRange)) {
        return
    }

    const cidr = new IPCIDR(ipRange)
    return [ cidr.start(), cidr.end() ]
}

/**
 * Push trusted proxies to DataDome
 */
async function pushToDataDomeTrustedProxies(name, cidrStart, cidrEnd) {

    const url = 'https://customer-api.datadome.co/1.1/protection/trustedproxies';
    let title = truncateString(`GCP ${name}`, 20)
    const options = {
    method: 'POST',
    headers: {'content-type': 'application/json', 'x-api-key': process.env.DATADOME_MANAGEMENT_KEY},
    body: JSON.stringify({
            data: {proxy_name: title, ip_start: cidrStart, ip_end: cidrEnd}
        })
    };

    const response = await fetch(url, options)
    if (!response.ok) {
        const message = `An error has occured: ${response.status}`
        throw new Error(message)
    }
}

/**
 * Truncate string to max number allowed
 * 
 * @param {string} str 
 * @param {int} maxLength 
 * @returns string
 */
function truncateString(str, maxLength) {
    if (str.length > maxLength) {
        return str.substring(0, maxLength - 3) + '...';
    }
    return str;
}


fetchGoogleIpRanges()
    .then(data => {
        const prefixes = data.prefixes
        
        if (prefixes.length > 0 ) {
            for ( let i=0; i<prefixes.length; i++) {
                let [ cidrStart, cidrEnd ] = fetchCidr(prefixes[i])
                let scope = prefixes[i].scope

                pushToDataDomeTrustedProxies(scope, cidrStart, cidrEnd)
                    .catch(error => {
                        console.log(error.message)
                    })
            }
        }
    })
    .catch(error => {
        console.log(error.message)
    })
