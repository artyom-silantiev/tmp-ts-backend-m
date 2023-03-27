import baseX from 'base-x';
import * as os from 'os';

function setupBs58() {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const bs58 = baseX(ALPHABET);

  const pid = process.pid;
  let addressInt = 0;

  let mac = '';
  const networkInterfaces = os.networkInterfaces();
  for (const interface_key in networkInterfaces) {
    const networkInterface = networkInterfaces[
      interface_key
    ] as os.NetworkInterfaceInfo[];
    const length = networkInterface.length;

    for (let i = 0; i < length; i++) {
      if (
        networkInterface[i].mac &&
        networkInterface[i].mac != '00:00:00:00:00:00'
      ) {
        mac = networkInterface[i].mac;
        break;
      }
    }
  }

  addressInt = mac ? parseInt(mac.replace(/:|\D+/gi, '')) : 0;

  function getRandomBs58String(length = 4) {
    let text = '';
    for (let i = 0; i < length; i++) {
      text += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return text;
  }

  function intToHex(intNum) {
    let hex = intNum.toString(16);
    if (hex.length % 2 > 0) {
      hex = '0' + hex;
    }
    return hex;
  }

  function fromInt(intNum) {
    const hex = intToHex(intNum);
    const bytes = Buffer.from(hex, 'hex');
    const res = bs58.encode(bytes);
    return res;
  }

  function toInt(bs58String: string) {
    const int = bs58.decode(bs58String).toString();
    return parseInt(int, 10);
  }

  function toHex(bs58String: string) {
    const int = bs58.decode(bs58String).toString();
    return parseInt(int, 16);
  }

  function uid(params?: { randChars?: number; cryptoOffset?: number }) {
    params = params || {};
    const randChars = params.randChars || 4;
    const cryptoOffset = params.cryptoOffset || 0;

    const pid58 = fromInt(pid);
    const addres58 = fromInt(addressInt);
    const ts58 = fromInt(Date.now());
    const rnd58Chars = getRandomBs58String(randChars);
    const cryptoInt = (Date.now() + cryptoOffset) % 58;
    const cryptoChar = fromInt(cryptoInt);
    const bs58str = rnd58Chars + ts58 + pid58 + addres58;
    let res = cryptoChar;
    for (let i = 0; i < bs58str.length; i++) {
      const char = bs58str[i];
      const charIndex = ALPHABET.indexOf(char);
      res = res + ALPHABET[(charIndex + cryptoInt + i * 3) % 58];
    }
    return res;
  }

  return { getRandomBs58String, intToHex, fromInt, toInt, toHex, uid };
}

const bs58 = setupBs58();

export function useBs58() {
  return bs58;
}
