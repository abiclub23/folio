import Head from 'next/head'

export default function About() {
  return (
    <>
      <Head>
        <title>About - Abhi Tondepu</title>
      </Head>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          About Me
        </h1>
        
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
          <div className="prose max-w-none">
            <p>
              Hello! I'm Abhi Tondepu, a Software Engineer based in Florida. I'm passionate about web development, UI design, and creating clean, efficient code.
            </p>
            
            <p>
              This website serves as my digital garden where I share my thoughts, projects, and experiences. I write about topics like web development, UI/UX design, and technology trends.
            </p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
          <h2 className="text-2xl font-bold mb-4">My Background</h2>
          <div className="prose max-w-none">
            <p>
              I have several years of experience in software engineering. I've worked with companies like Bank of America and IBM, and specialize in front-end development and UI design.
            </p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-8">
          <h2 className="text-2xl font-bold mb-4">What I'm Doing Now</h2>
          <div className="prose max-w-none">
            <p>
              Currently, I'm working on various web development projects and expanding my knowledge in modern frameworks. I'm also interested in exploring new technologies and sharing my experiences through my blog.
            </p>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
          <div className="prose max-w-none">
            <p>
              I'm always open to interesting conversations and opportunities. Feel free to reach out to me via email at <a href="mailto:atondepu@gmail.com">atondepu@gmail.com</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  )
} 