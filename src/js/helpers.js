import { async } from "regenerator-runtime";

const TIMEOUT_SEC = 10;

const timeout = function (sec) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${sec} second`));
    }, sec * 1000);
  });
};

export const getJSON = async function (url) {
  try {
    const res = await Promise.race([fetch(url), timeout(TIMEOUT_SEC)]);
    const data = await res.json();

    if (!res.ok) throw new Error(`${data.message} (${res.status})`);

    if (data.results?.length === 0) throw new Error(`Location not found`);

    return data;
  } catch (err) {
    throw err;
  }
};
