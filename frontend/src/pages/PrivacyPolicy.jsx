import React from 'react'
import { ArrowLeft, Shield, Lock, Eye, Database, Users, Mail, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/common/SEO'

const PrivacyPolicy = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen gradient-bg">
      <SEO
        title="Kamioi Privacy Policy: How We Protect Your Data"
        description="Learn how Kamioi protects your personal and financial data. Our privacy policy covers data collection, usage, security measures, and your rights as a user of our investing platform."
        breadcrumbs={[
          { name: "Home", url: "https://kamioi.com/" },
          { name: "Privacy Policy", url: "https://kamioi.com/privacy-policy" }
        ]}
      />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white/70 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-blue-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 text-lg mb-8">
                Last updated: January 5, 2025
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <Lock className="w-6 h-6 mr-2 text-blue-400" />
                  1. Information We Collect
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This may include:
                </p>
                <ul className="text-gray-300 list-disc list-inside space-y-2 ml-4">
                  <li>Personal information (name, email, phone number)</li>
                  <li>Financial information (bank account details, investment preferences)</li>
                  <li>Transaction data (purchase history, investment activity)</li>
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (how you interact with our services)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <Eye className="w-6 h-6 mr-2 text-blue-400" />
                  2. How We Use Your Information
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="text-gray-300 list-disc list-inside space-y-2 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Develop new products and services</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <Database className="w-6 h-6 mr-2 text-blue-400" />
                  3. Information Sharing
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:
                </p>
                <ul className="text-gray-300 list-disc list-inside space-y-2 ml-4">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and safety</li>
                  <li>With trusted service providers who assist in our operations</li>
                  <li>In connection with a business transfer or acquisition</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-blue-400" />
                  4. Data Security
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-blue-400" />
                  5. Your Rights
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="text-gray-300 list-disc list-inside space-y-2 ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Delete your personal information</li>
                  <li>Restrict processing of your information</li>
                  <li>Data portability</li>
                  <li>Object to processing</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  6. Cookies and Tracking
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  7. Third-Party Services
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Our services may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies before providing any information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  8. Children&apos;s Privacy
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  9. Changes to This Policy
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this Privacy Policy periodically.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <Mail className="w-6 h-6 mr-2 text-blue-400" />
                  10. Contact Us
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <p className="text-white flex items-center mb-2">
                    <Mail className="w-4 h-4 mr-2" />
                    Email: privacy@kamioi.com
                  </p>
                  <p className="text-white flex items-center mb-2">
                    <Phone className="w-4 h-4 mr-2" />
                    Phone: 1-800-KAMIOI
                  </p>
                  <p className="text-white">
                    Address: 123 Investment Street, Financial District, NY 10001
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
