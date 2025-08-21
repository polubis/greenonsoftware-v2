// const api4Contract = contract({
// getTasks: {
// // Required
// // Infered extra, searchParams, and pathParams if defined
// // Required
// dto: check(z.object({
// tasks: z.array(z.object({
// id: z.number().int().positive(),
// title: z.string().min(1).max(255),
// description: z.string().min(1).max(255),
// }))
// })),
// // Required
// error: check(z.object({
// type: z.literal('bad_request'),
// message: z.string(),
// })),
// // Optional
// searchParams: check(z.object({
// limit: z.number().int().positive(),
// offset: z.number().int().positive(),
// })),
// // Optional
// pathParams: check(z.object({
// id: z.number().int().positive(),
// })),
// // Optional
// payload: check(z.object({
// id: z.number().int().positive(),
// })),
// }
// }, { baseUrl: 'http://localhost:3000' })

// api4Contract.schemas.getTasks.dto() // Returns schema

// const api4ContractServer = createServer(api4Contract, {
// mode: 'strict|loose',
// })

// const api4ContractClient = createClient(api4Contract, {
// getTasks: {
// resolver: createResolver<Extra>(({ extra, searchParams, payload }) => {
// return fetch(APIRouter.getPath("tasks"), {
// signal,
// }).then((res) => res.json());
// })
// }
// }, {
// mode: 'strict|loose',
// })

// // Creates dto
// api4ContractClient.getTasks.dto() // Validates (if mode = strict)
// api4ContractClient.getTasks.searchParams() // Validates (if mode = strict)
// api4ContractClient.getTasks.pathParams() // Validates (if mode = strict)
// api4ContractClient.getTasks.parseError()
// api4ContractClient.getTasks.payload() // Validates (if mode = strict)
// api4ContractClient.getTasks.call() // Validates (if mode = strict)
// api4ContractClient.getTasks.safeCall() // Validates (if mode = strict)

// api4ContractServer.getTasks.dto(); // Validates (if mode = strict)
// api4ContractServer.getTasks.searchParams(); // Validates (if mode = strict)  
// api4ContractServer.getTasks.pathParams(); // Validates (if mode = strict)
// api4ContractServer.getTasks.error(); // Validates (if mode = strict)
// api4ContractServer.getTasks.payload(); // Validates (if mode = strict)
// api4ContractServer.getTasks.parseError();
