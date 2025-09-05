import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const LandingPage: React.FC = () => {
  const cardVariants = {
    offscreen: { y: 50, opacity: 0 },
    onscreen: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', bounce: 0.4, duration: 0.8 }
    }
  };

  return (
    <div className="bg-dark-100 text-white">
      <Header />

      {/* Hero Section */}
      <main className="pt-20">
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="absolute w-96 h-96 bg-primary rounded-full -top-20 -left-20 filter blur-3xl opacity-20"></div>
            <div className="absolute w-96 h-96 bg-secondary rounded-full -bottom-20 -right-20 filter blur-3xl opacity-20"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                <motion.h1 
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-5xl md:text-7xl font-extrabold tracking-tighter"
                >
                    Back <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Greatness</span>.
                    <br />
                    Be Part of the Win.
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-4 max-w-2xl mx-auto text-lg text-light-200"
                >
                    The ultimate platform for live events. Create, join, and back participants in anything from sports to rap battles.
                </motion.p>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4"
                >
                    <Link to="/signup" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/40 flex items-center justify-center">
                        Join an Event <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                    <Link to="/signup" className="w-full sm:w-auto bg-dark-300 hover:bg-dark-200 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105">
                        Create Your Own
                    </Link>
                </motion.div>
            </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-dark-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.8 }} className="p-8 bg-dark-100 rounded-xl">
                <Zap className="w-12 h-12 mx-auto text-primary mb-4"/>
                <h3 className="text-2xl font-bold mb-2">1. Create or Find</h3>
                <p className="text-light-200">Launch your own event in seconds or browse a universe of live competitions.</p>
              </motion.div>
              <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.8 }} className="p-8 bg-dark-100 rounded-xl">
                <Users className="w-12 h-12 mx-auto text-secondary mb-4"/>
                <h3 className="text-2xl font-bold mb-2">2. Join & Back</h3>
                <p className="text-light-200">Participate yourself or back the contestants you believe in. Your support fuels the hype.</p>
              </motion.div>
              <motion.div variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.8 }} className="p-8 bg-dark-100 rounded-xl">
                <Trophy className="w-12 h-12 mx-auto text-primary mb-4"/>
                <h3 className="text-2xl font-bold mb-2">3. Watch & Win</h3>
                <p className="text-light-200">Follow the live leaderboard, celebrate victories, and be part of the winning moment.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Who It's For Section */}
        <section id="who-its-for" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-12">Built for Every Kind of Hype</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {['Gamers', 'Dancers', 'Rappers', 'Athletes', 'Creators', 'Debaters', 'Fans', 'Communities'].map(item => (
                    <motion.div key={item} variants={cardVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.8 }} className="bg-dark-300 p-6 rounded-lg text-center">
                        <p className="text-xl font-semibold">{item}</p>
                    </motion.div>
                ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
