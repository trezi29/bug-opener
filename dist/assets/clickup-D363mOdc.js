const f="https://api.linear.app/graphql";async function c(e,a,t){var n;const s=await fetch(f,{method:"POST",headers:{"Content-Type":"application/json",Authorization:e},body:JSON.stringify({query:a,variables:t})});if(!s.ok)throw new Error(`Linear API error: ${s.status} ${s.statusText}`);const r=await s.json();if((n=r.errors)!=null&&n.length)throw new Error(`Linear GraphQL error: ${r.errors[0].message}`);return r.data}async function m(e){return(await c(e,"query { viewer { id name email } }")).viewer}async function h(e){return(await c(e,"query { teams { nodes { id name } } }")).teams.nodes}async function w(e,a){return(await c(e,"query($teamId: String!) { team(id: $teamId) { projects { nodes { id name } } } }",{teamId:a})).team.projects.nodes}async function y(e,a){const t=await c(e,`mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url }
      }
    }`,{input:{title:a.title,description:a.description,teamId:a.teamId,...a.projectId?{projectId:a.projectId}:{}}});if(!t.issueCreate.success)throw new Error("Failed to create Linear issue");return t.issueCreate.issue}async function $(e,a){const t=`bug-screenshot-${Date.now()}.png`,s=await c(e,`mutation($filename: String!, $contentType: String!, $size: Int!) {
      fileUpload(filename: $filename, contentType: $contentType, size: $size) {
        uploadFile {
          uploadUrl
          assetUrl
          headers {
            key
            value
          }
        }
      }
    }`,{filename:t,contentType:"image/png",size:a.size}),{uploadUrl:r,assetUrl:n,headers:i}=s.fileUpload.uploadFile,d={};for(const l of i)d[l.key]=l.value;const u=await fetch(r,{method:"PUT",headers:d,body:a});if(!u.ok)throw new Error(`Failed to upload image to Linear: ${u.status}`);return n}const p="https://api.clickup.com/api/v2";async function o(e,a,t){const s=await fetch(`${p}${a}`,{...t,headers:{Authorization:e,...(t==null?void 0:t.headers)??{}}});if(!s.ok){const r=await s.text();throw new Error(`ClickUp API error: ${s.status} — ${r}`)}return s.json()}async function k(e){return(await o(e,"/user")).user}async function g(e){return(await o(e,"/team")).teams.map(t=>({id:t.id,name:t.name}))}async function I(e,a){return(await o(e,`/team/${a}/space`)).spaces.map(s=>({id:s.id,name:s.name}))}async function C(e,a){const s=(await o(e,`/space/${a}/list`)).lists.map(n=>({id:n.id,name:n.name})),r=await o(e,`/space/${a}/folder`);for(const n of r.folders)for(const i of n.lists)s.push({id:i.id,name:`${n.name} / ${i.name}`});return s}async function U(e,a){const t=await o(e,`/list/${a.listId}/task`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:a.name,markdown_description:a.description,tags:["bug"]})});return{id:t.id,url:t.url}}async function L(e,a,t,s){const r=new FormData;r.append("attachment",t,s);const n=await fetch(`${p}/task/${a}/attachment`,{method:"POST",headers:{Authorization:e},body:r});if(!n.ok){const i=await n.text();throw new Error(`ClickUp attachment failed: ${n.status} — ${i}`)}}export{w as a,g as b,I as c,C as d,k as e,h as f,y as g,U as h,L as i,$ as u,m as v};
