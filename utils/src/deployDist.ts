import { Dirent, readFileSync } from "node:fs";
import { readdir as readDir, readFile } from 'node:fs/promises';
import path from "node:path";
import pick from 'lodash/pick'
import mime from 'mime-types'

import { S3Client, PutObjectCommand, PutObjectCommandOutput } from "@aws-sdk/client-s3";

type FileNameObject = 
  {
    fullPath: string;
    s3key: string;
  }


const srcFolder = path.resolve(__dirname, '..', '..', 'frontend', 'dist')
const jsonPath = path.resolve(__dirname, '..', '..', 'backend', 'stackOutputs.json')
const stackOutputs = JSON.parse(readFileSync(jsonPath, 'utf-8'));

const {assetBucketName, appRegion} = pick({...stackOutputs.YourNameAppStack}, 'assetBucketName', 'appRegion')
const s3keyPrefix = 'web/static'  // no prepending or trailing slashes

console.log(assetBucketName)
console.log(appRegion)
console.log(srcFolder,)

const s3 = new S3Client({ region: appRegion });

readDir(srcFolder, {recursive: true, withFileTypes: true})          // List srcFolder entries
  .then((readDirResult:Dirent[])=>                                  // then result is Dirent[]
    readDirResult
      .filter(readDirEntry=>readDirEntry.isFile())                  // result file names Dirent[]
      .map((fileEntry: Dirent) => path.join(fileEntry.parentPath, fileEntry.name))
      .map((fullPath: string)=>({fullPath, s3key: path.relative(srcFolder, fullPath)}))      // result FileNameObject[] -> [{fullPath:'asd', s3key:'qwe'}, ...]
  )
  .then((filePathEntries: FileNameObject[])=>{                      // then iterate through FileNameObject[] elements
    filePathEntries.map((fileNameObject: FileNameObject)=>{
      readFile(fileNameObject.fullPath)                             // readFile
        .then((fileContent) => {
          console.log(`readfile: ${fileNameObject.fullPath}`)
          const s3key = `${s3keyPrefix}/${fileNameObject.s3key}`    // s3key
          const contentType = (mime.lookup(fileNameObject.fullPath) ?? 'text/html') as string    // MIME contentType
          const putCommand = new PutObjectCommand({                 // S3 PutObject
            Bucket: assetBucketName,
            Key: s3key,
            Body: fileContent,
            ContentType: contentType,
          });

          s3.send(putCommand)
            .then((putOutput: PutObjectCommandOutput)=>console.log(`Uploaded ${s3key}; MIME: ${contentType}`))
            .catch((err)=>`s3.send err: ${console.error(err)}`)
        })
        .catch((err)=>`readFile err: ${console.error(err)}`)
    })
  })
  .catch((err)=>console.error(err))
