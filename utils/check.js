module.exports.checkRequired = (data, requiredItemList) => {
  let returnObject = {flag: true}
  if (data && requiredItemList instanceof Array && requiredItemList.length > 0) {
    requiredItemList.forEach((v, i) => {
      if (!data[v]) returnObject.flag = false
    });
  } else {
    returnObject.flag = false
  }

  if (!returnObject.flag) {
    console.error(`필수항목 ${JSON.stringify(requiredItemList)} 누락 >> ${JSON.stringify(data)}`)
    returnObject.errMsg = `필수항목 ${JSON.stringify(requiredItemList)} 누락 >> ${JSON.stringify(data)}`
  }

  return returnObject
}