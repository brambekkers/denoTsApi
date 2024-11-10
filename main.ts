import { Hono, type Context } from '@hono/hono'
import type { SubjectSummary, SubjectKey } from './types/DataModel.ts'
import { docs } from './data/docs.ts'

const app = new Hono()

// Routes
app.get('/', (c) => c.text('Hello from the type docs server!'))
app.get('/subjects', (c) => c.json(getSubjects()))
app.get('/subjects/:key', (c) => {
  const key = c.req.param('key')
  return getSubjectResponse(key, c)
})

app.post('/subjects/:key', async (c) => {
  const body = await c.req.json()
  const key = c.req.param('key')

  writeJson(`data/${key}.json`, body)
})

// Functions
const getSubjects = (): SubjectSummary[] => {
  return Object.entries(docs.subjects).map(([subjectKey, subject]) => ({
    name: subject.name,
    key: subjectKey as SubjectKey,
    level: subject.level,
    description: subject.description,
    tags: [...new Set(subject.topics.map((topic) => topic.tags).flat())],
    topics: subject.topics.map((topic) => topic.name)
  }))
}

const getSubjectResponse = (key: string, c: Context) => {
  if (!key) {
    c.status(400)
    return c.text('Missing subject key')
  }

  if (typeof key !== 'string') {
    c.status(400)
    return c.text('Invalid subject key. Key should be a string')
  }

  const subject = docs.subjects[key as SubjectKey]
  if (!subject) {
    c.status(404)
    return c.text('Subject not found')
  }

  return c.json(subject)
}

function writeJson(filePath: string = 'data/test.json', o: any) {
  Deno.writeTextFileSync(filePath, JSON.stringify(o))
}

Deno.serve(app.fetch)
