import fs from "fs";
import path from "path";
import htmlMinify from "html-minifier";
import aws from "aws-sdk";
import dotenv from "dotenv";
import { MapEnv } from 'map-env-node';
import { IAWSCredential } from './interfaces/IAWSCredential';
dotenv.config();

const actions = [
    {
        'cmd': 'create-template',
        'callback': (templateName:string) => {createTemplate(templateName)}
    },
    {
        'cmd': 'get-template',
        'callback': (templateName:string) => {getTemplate(templateName)}
    },
    {
        'cmd': 'update-template',
        'callback': (templateName:string) => {updateTemplate(templateName)}
    },
    {
        'cmd': 'delete-template',
        'callback': (templateName:string) => {deleteTemplate(templateName)}
    },
    {
        'cmd': 'compare-version',
        'callback': (templateName:string) => {compareVersion(templateName)}
    }
];

var awsCredential:IAWSCredential;

if(process.argv.length >= 4){

    awsCredential = MapEnv.get<IAWSCredential>("AWS_CREDENTIAL");
    const argument = process.argv[2].toLowerCase();
    const templateName = process.argv[3];
    
    const filtered = actions.filter((item) => item.cmd === argument);
    if(filtered.length > 0){
        filtered[0].callback(templateName);
    }
}

function successMessage(message:string){
    console.log('\u001b[' + 32 + 'm' + message + '\u001b[0m')
}

function errorMessage(message:string){
    console.log('\u001b[' + 31 + 'm' + message + '\u001b[0m')
}

function getTemplateHtmlPart(templateName:string):string{
    const templatePath = './src/templates/';
    let templateFile = fs.readFileSync(templatePath  + templateName, {encoding:'utf8', flag:'r'});
    return htmlMinify.minify(templateFile,{
        collapseWhitespace:true
    });
}


async function createTemplate(templateName:string){
    if(process.argv.length === 4){
        errorMessage('The subject must be specified');
        return;
    }

    try{
        const name = templateName.split('.')[0];
        const htmlPart = getTemplateHtmlPart(templateName);
        const subjectPart =  process.argv[4];
        const {accessKeyId, secretAccessKey, region} = awsCredential;
        const ses = new aws.SES({accessKeyId, secretAccessKey, region});
        var params = {
            Template: { 
                TemplateName: name, 
                HtmlPart: htmlPart,
                SubjectPart:subjectPart
            }
        }

        await ses.createTemplate(params).promise();
        successMessage('Template successfully created!');
    }  
    catch(ex){
        if(ex.message){
            errorMessage(ex.message);
        }
        else{
            errorMessage(ex);
        }
    }
}

async function getTemplate(templateName:string){
    
}

async function updateTemplate(templateName:string){
    
    try{
        const name = templateName.split('.')[0];
        const htmlPart = getTemplateHtmlPart(templateName);
        const {accessKeyId, secretAccessKey, region} = awsCredential;
        const ses = new aws.SES({accessKeyId, secretAccessKey, region});
        const response = await ses.getTemplate({TemplateName:name}).promise();
        
        var params = {
            Template: { 
                TemplateName: name, 
                HtmlPart: htmlPart,
                SubjectPart:process.argv[4] || response.Template?.SubjectPart
            }
        }

        await ses.updateTemplate(params).promise();
        successMessage('Template successfully updated!');
    }  
    catch(ex){
        if(ex.message){
            errorMessage(ex.message);
        }
        else{
            errorMessage(ex);
        }
    }
}

async function deleteTemplate(templateName:string){
    try{
        const name = (templateName.indexOf('.') === -1)  ? templateName : templateName.split('.')[0];
        const {accessKeyId, secretAccessKey, region} = awsCredential;
        const ses = new aws.SES({accessKeyId, secretAccessKey, region});
        var params = {
            TemplateName: name
        }
        
        await ses.deleteTemplate(params).promise();
        successMessage('Template successfully deleted!');
    }  
    catch(ex){
        if(ex.message){
            errorMessage(ex.message);
        }
        else{
            errorMessage(ex);
        }
    }
}

async function compareVersion(templateName:string){
    
    try{
        const localName  = (templateName.indexOf('.') === -1)  ? templateName + '.html' : templateName;
        const onlineName = (templateName.indexOf('.') === -1)  ? templateName : templateName.split('.')[0];
        const localFile = getTemplateHtmlPart(localName);
        const {accessKeyId, secretAccessKey, region} = awsCredential;
        const ses = new aws.SES({accessKeyId, secretAccessKey, region});
        const response = await ses.getTemplate({TemplateName:onlineName}).promise();
        if(response.Template?.HtmlPart?.toString() === localFile){
            successMessage('The templates are the same!');
        }
        else{
            errorMessage('The templates are different!');
        }
    }  
    catch(ex){
        if(ex.message){
            errorMessage(ex.message);
        }
        else{
            errorMessage(ex);
        }
    }
}
