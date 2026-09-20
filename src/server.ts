import app from './app'

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`SpaceHub API running on port ${PORT}`)
  console.log(`GraphQL playground: http://localhost:${PORT}/api/graphql`)
})
