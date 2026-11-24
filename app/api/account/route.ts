import {identify,privateHeaders,runtime} from '../../identity';
export async function GET(request:Request){return Response.json({user:await identify(request),googleClientId:runtime().GOOGLE_CLIENT_ID||null},{headers:privateHeaders})}
