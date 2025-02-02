import pick from 'lodash/pick'
import path from 'path';
import fs from 'fs';

export default function cloudfrontKeys() {
    const 
      name = 'cloudfrontKeys',
      virtualModuleId = `virtual:${name}`,
      processData = 
        (data:any) => 
          pick(data, 'publicKey')

 
  return {
    name: 'cloudfront-keys-plugin',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return '\0' + virtualModuleId;
      }
    },
    load(id: string) {
      if (id === '\0' + virtualModuleId) {
        const jsonPath = path.resolve(__dirname, '..', '..', 'backend', 'cloudfrontKeys.json')
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const processedData = processData(jsonData);
        return `export default ${JSON.stringify(processedData)}`;
      }
    }
  }
}
