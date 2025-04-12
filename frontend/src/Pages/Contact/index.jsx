import { useState } from 'react';
import { Container } from '../../components/ui';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/contact', formData);

      if (response.data.success) {
        addToast(response.data.message, { type: 'success' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        addToast(response.data.message || 'Failed to send message.', { type: 'error' });
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      addToast(
        error.response?.data?.message || 'An error occurred. Please try again later.', 
        { type: 'error' } 
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="py-10">
      <Container>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
              <div className="bg-yumrun-orange/10 rounded-full w-16 h-16 flex items-center justify-center mb-4 text-yumrun-orange">
                <FaMapMarkerAlt size={24} />
              </div>
              <h3 className="font-semibold mb-2">Our Location</h3>
              <p className="text-gray-600">
                123 YumRun Street<br />
                Foodie District<br />
                Kathmandu, Nepal
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
              <div className="bg-yumrun-orange/10 rounded-full w-16 h-16 flex items-center justify-center mb-4 text-yumrun-orange">
                <FaPhone size={24} />
              </div>
              <h3 className="font-semibold mb-2">Phone Number</h3>
              <p className="text-gray-600">
                Customer Support:<br />
                +977 1 2345678<br />
                Restaurant Partners:<br />
                +977 1 8765432
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center">
              <div className="bg-yumrun-orange/10 rounded-full w-16 h-16 flex items-center justify-center mb-4 text-yumrun-orange">
                <FaClock size={24} />
              </div>
              <h3 className="font-semibold mb-2">Working Hours</h3>
              <p className="text-gray-600">
                Monday - Friday:<br />
                9:00 AM - 8:00 PM<br />
                Saturday - Sunday:<br />
                10:00 AM - 7:00 PM
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 text-yumrun-orange">Send us a Message</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="message" className="block text-gray-700 font-medium mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yumrun-orange"
                    required
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-yumrun-orange text-white py-2 px-6 rounded-md hover:bg-yumrun-orange/90 transition duration-300 disabled:opacity-70"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 text-yumrun-orange">Get in Touch</h2>
              <p className="mb-6">
                Have questions, feedback, or need assistance? We&apos;d love to hear from you! 
                Fill out the form or reach out to us directly using the contact information provided.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-yumrun-orange/10 rounded-full w-10 h-10 flex items-center justify-center mr-4 mt-1 text-yumrun-orange flex-shrink-0">
                    <FaEnvelope size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">Email Us</h4>
                    <p className="text-gray-600">
                      Customer Support: support@yumrun.com<br />
                      Business Inquiries: business@yumrun.com<br />
                      Restaurant Partners: partners@yumrun.com
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-yumrun-orange/10 rounded-full w-10 h-10 flex items-center justify-center mr-4 mt-1 text-yumrun-orange flex-shrink-0">
                    <FaMapMarkerAlt size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">Headquarters</h4>
                    <p className="text-gray-600">
                      123 YumRun Street<br />
                      Foodie District<br />
                      Kathmandu, Nepal<br />
                      Postal Code: 44600
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Contact; 