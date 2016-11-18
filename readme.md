#Emiya Angular2 Fetch

##How to install
```
npm install --save emiya-angular2-fetch
```


## Features

* provide api to fetch data from remote/local address
* integrated token auto management and login redirection


### Usage

```
export const Api = {
  
  //full config
  "full": {
    "url": {  //request url,different key correspond to different runtime enviroment
       "release": "http://www.hcf/h0/users/token", 
       "local": "local://hcf/h0/users/token.json",     //prefix "local://" means it request a local json file in your project path
       "dev": "/hcf/h0/users/token", 
       "beta": "http://172.26.0.235:4040/h0/users/token"
    },
    "method": "post",   //get(default)/post/put/delete
    "headers":{uuid:'dasklaslkfh313124124'}, //additional added to request header
    "params":{userid:'emiyalee'},   //url query params
    "data":{password:'fasfgjal;sk2312412'},   //body params
    "restful":{index:0},     //restful params,for example a request url like '/abc/:index/' will transform to '/abc/0/' 
   
    "timeout": 6000,   //request timeout,unit is ms,default is 15000
    "sendTokens": [{   //optional,auto send token config,can be mutilple
      "token_map": "uuid",   //id for this token
      "token_src": "local",  //where we get this token,local or session,default is local
      "token_transfer_mode": "header",  //where we put this token on,header/query/payload/restful
      "token_name": "access_token"    //how we named this token in header/query/payload/restful
    },
    "getTokens": [{  //optional,auto get token config,can be mutilple
      "token_receive_mode": "header",  //where we get this token,header/payload
      "token_receive_path": "data.access_token.[2].[0]",   //get token from json structure like {data:access_token[[..],                               [..],["tokenHere",..]}
      "token_map": "a3", how we named this token
      "token_storage_method": "local"   //where we put this token,local or session,default is local
    },..],
    "removeTokens": [{optional,auto remove token config,can be mutilple
      "response_type": "success",  //on request sucess(status=200) or "error"(status!=200)
      condition_mode: 'payload',//header|payload   //determine the target data flag path(header/payload) 
      condition_path: 'data.list.[0].status',//determine the target data flag path
      condition_value: 'ok',//optional,determine the target data flag value,null means any value representing matched,otherwise only value===condition_value means matched
      "token_map": "uuid",    //which token we want to remove
      "token_remove_method": "local",   //where the token we removed from
    }, ..]
  },
  
  //minimal config
  "mini": {
    "url": {
      "release": "abc",
      "local": "/hcf/globalsearch/portal/querybykeyword",
      "dev": "/hcf/globalsearch/portal/querybykeyword",
      "test": "abc9"
    }
  }
  
}

export const proxy = [  //proxy config
  { //in cordova running enviroment or proxy force enable set to true,any request via fetch with keyword '/hcf/' will replace with "http://www.google.com/hcfbase/hcf/"
    "path": "/hcf/",
    "proxyUrl": "http://www.google.com/hcfbase/hcf/"
  },..]

```

```
import {Fetch} from "emiya-angular2-fetch";
import {Api} from "Api";

@Component({
  template: `<ion-nav></ion-nav>`
})
export class MyApp {

constructor(platform: Platform, fetch: Fetch,) {
    //load config
    fetch.load('dev', Api, proxy)   //'dev' tell fetch to use url.dev as request url,Api and proxy is what you define above
    
    //initiate a request
    fetch.request({
      "url":'full',    //use Api.full config
      "method": "post",   //get(default)/post/put/delete
      "headers":{uuid:'dasklaslkfh313124124'}, //additional added to request header
      "params":{userid:'emiyalee'},   //url query params
      "data":{password:'fasfgjal;sk2312412'},   //body params
      "restful":{index:0},     //restful params,for example a request url like '/abc/:index/' will transform to '/abc/0/' 
    }).then((data)=>{dosomething..}).catch((err)=>{dosomething..})
    
    
    //or you can initiate a request without using config
    fetch.request({
      "url":'http://www.google.com/hcfbase/hcf/login',    //fetch can not find this url in config so will treat this as a direct request url
      "method": "post",
    }).then((data)=>{dosomething..}).catch((err)=>{dosomething..})
    
    
    //get request url
    let url=this.fetch.src('lite',{params:{index:0}})    //fetch.srcWithoutToken do the same just without any token
    console.log(url)  //url="http://www.google.com/hcfbase/hcf/globalsearch/portal/querybykeyword?index=0"
    
    
    
  }
}
```

### How to set and delete token

```
import {Router} from 'emiya-angular2-token';

export class TabsPage {

constructor() {
    //set tokon
    Token.set('uuid','fasfasjfasjlk9312jkkfasjfaskl')
    Token.set('token','fasfasjfasjlk9312jkkfasjfaskl')
    //delete token
    Token.delete('uuid')
    Token.delete('token')
    //check if token exists
    Token.has('uuid')   //true or false
    Token.has('token')
  }
}
```
#####more can be found [emiya-angular2-token](https://github.com/ionic2-ninja/emiya-angular2-token)


### Api Referrences(todo..)


