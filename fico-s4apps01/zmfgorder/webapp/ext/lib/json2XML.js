function jsonToXml(json, tab = '') {  
    let xml = '';  
    if (typeof json === 'object' && json !== null) {  
        // 判断是否为数组  
        if (Array.isArray(json)) {  
            json.forEach(item => {  
                // 假设数组元素都是对象，且每个对象都转换成相同的XML节点  
                xml += `${tab}<items>` + jsonToXml(item, tab + '\t') + `${tab}</items>\n`;  
                //xml += `${tab}` + jsonToXml(item, tab + '\t') + `${tab}\n`;  
            });  
        } else {  
            // 遍历对象的每个属性  
            for (let key in json) {  
                if (json.hasOwnProperty(key)) {  
                    let value = json[key];  
                    let attr = '';  
  
                    // 处理特殊情况，如属性值是对象或数组，则递归  
                    if (typeof value === 'object' && value !== null) {  
                        xml += `${tab}<${key}>` + jsonToXml(value, tab + '\t') + `${tab}</${key}>\n`;  
                    } else {  
                        // 简单的值类型，直接转换为XML节点  
                        xml += `${tab}<${key}>${value.toString()}</${key}>\n`;  
                    }  
                }  
            }  
        }  
    }  
    return xml;  
}  