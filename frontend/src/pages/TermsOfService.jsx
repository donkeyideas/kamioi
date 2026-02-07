import React from 'react'
import { ArrowLeft, Gavel, AlertCircle, Shield, FileText, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/common/SEO'

const TermsOfService = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen gradient-bg">
      <SEO
        title="Kamioi Terms of Service: User Agreement"
        description="Read the Kamioi Terms of Service. Understand your rights and responsibilities when using our automatic investing platform, including account usage, fees, and investment disclaimers."
        breadcrumbs={[
          { name: "Home", url: "https://kamioi.com/" },
          { name: "Terms of Service", url: "https://kamioi.com/terms-of-service" }
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
            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
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
                  <FileText className="w-6 h-6 mr-2 text-blue-400" />
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  By accessing and using Kamioi&apos;s services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-blue-400" />
                  2. Use License
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Permission is granted to temporarily download one copy of Kamioi&apos;s materials for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="text-gray-300 list-disc list-inside space-y-2 ml-4">
                  <li>modify or copy the materials</li>
                  <li>use the materials for any commercial purpose or for any public display</li>
                  <li>attempt to reverse engineer any software contained on Kamioi&apos;s website</li>
                  <li>remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <Gavel className="w-6 h-6 mr-2 text-blue-400" />
                  3. Investment Services
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Kamioi provides investment services including but not limited to:
                </p>
                <ul className="text-gray-300 list-disc list-inside space-y-2 ml-4">
                  <li>Round-up investment services</li>
                  <li>AI-powered investment recommendations</li>
                  <li>Portfolio management tools</li>
                  <li>Family and business investment accounts</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  All investments carry risk, and past performance does not guarantee future results. You should carefully consider your investment objectives, level of experience, and risk appetite before making any investment decisions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-2 text-blue-400" />
                  4. Risk Disclosure
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Investing involves substantial risk of loss and is not suitable for all investors. The value of your investment may go down as well as up, and you may not get back the amount originally invested. You should not invest money that you cannot afford to lose.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  5. User Responsibilities
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  As a user of Kamioi&apos;s services, you agree to:
                </p>
                <ul className="text-gray-300 list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not use the service for any illegal or unauthorized purpose</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  6. Limitation of Liability
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  In no event shall Kamioi, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  7. Changes to Terms
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Kamioi reserves the right to modify these terms at any time. We will notify users of any material changes via email or through the service. Your continued use of the service after such modifications constitutes acceptance of the updated terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-4">
                  8. Contact Information
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <p className="text-white">Email: legal@kamioi.com</p>
                  <p className="text-white">Phone: 1-800-KAMIOI</p>
                  <p className="text-white">Address: 123 Investment Street, Financial District, NY 10001</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService
