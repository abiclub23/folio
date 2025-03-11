import Head from 'next/head'

export default function About() {
  return (
    <>
      <Head>
        <title>About - Your Name</title>
      </Head>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-text mb-8 relative inline-block">
          About Me
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent"></div>
        </h1>
        
        <div className="glass-card rounded-lg shadow-glass p-8 mb-8 transform rotate-1">
          <div className="prose max-w-none">
            <p>
              Hello! I'm Your Name, a [your profession] based in [your location]. I'm passionate about [your interests].
            </p>
            
            <p>
              This website serves as my digital garden where I share my thoughts, projects, and experiences. I write about topics like [topic 1], [topic 2], and [topic 3].
            </p>
          </div>
        </div>
        
        <div className="glass-card rounded-lg shadow-glass p-8 mb-8 transform -rotate-1">
          <h2 className="text-2xl font-bold text-text mb-4">My Background</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary mb-4 rounded-full"></div>
          <div className="prose max-w-none">
            <p>
              I have [X] years of experience in [your field]. I've worked with [technologies/companies/projects] and specialize in [your specialties].
            </p>
          </div>
        </div>
        
        <div className="glass-card rounded-lg shadow-glass p-8 mb-8 transform rotate-1">
          <h2 className="text-2xl font-bold text-text mb-4">What I'm Doing Now</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-secondary to-accent mb-4 rounded-full"></div>
          <div className="prose max-w-none">
            <p>
              Currently, I'm [what you're currently working on or learning]. I'm also [other current activities or interests].
            </p>
          </div>
        </div>
        
        <div className="glass-card rounded-lg shadow-glass p-8 transform -rotate-1">
          <h2 className="text-2xl font-bold text-text mb-4">Get in Touch</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-accent to-primary mb-4 rounded-full"></div>
          <div className="prose max-w-none">
            <p>
              I'm always open to interesting conversations and opportunities. Feel free to reach out to me via email at <a href="mailto:your.email@example.com">your.email@example.com</a> or connect with me on social media.
            </p>
          </div>
        </div>
      </div>
    </>
  )
} 