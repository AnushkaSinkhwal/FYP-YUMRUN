import { Container } from '../../components/ui';

const About = () => {
  return (
    <div className="py-10">
      <Container>
        <div className="max-w-4xl mx-auto">
          <h1 className="mb-6 text-3xl font-bold text-center">About Us</h1>
          
          <div className="p-6 mb-8 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-2xl font-semibold text-yumrun-orange">Our Story</h2>
            <p className="mb-4">
              Welcome to YumRun, your premier food delivery platform connecting hungry customers with the best local restaurants. 
              Founded with a passion for great food and exceptional service, YumRun has quickly become the go-to destination for 
              food lovers across the region.
            </p>
            <p className="mb-4">
              Our journey began with a simple idea: make delicious food from local restaurants accessible to everyone, anywhere.
              Since our launch, we've partnered with hundreds of restaurants to bring a diverse range of cuisines right to your doorstep.
            </p>
          </div>
          
          <div className="p-6 mb-8 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-2xl font-semibold text-yumrun-orange">Our Mission</h2>
            <p className="mb-4">
              At YumRun, our mission is to transform how people experience food delivery. We strive to:
            </p>
            <ul className="pl-6 mb-4 space-y-2 list-disc">
              <li>Connect customers with the best local dining options</li>
              <li>Support local restaurants and help them expand their customer base</li>
              <li>Provide quick, reliable delivery services</li>
              <li>Ensure a seamless and enjoyable ordering experience</li>
              <li>Maintain the highest standards of food quality and safety</li>
            </ul>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-2xl font-semibold text-yumrun-orange">How It Works</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                  <span className="text-2xl font-bold text-yumrun-orange">1</span>
                </div>
                <h3 className="mb-2 font-semibold">Browse Restaurants</h3>
                <p className="text-sm">Explore our curated selection of local restaurants and their menus</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                  <span className="text-2xl font-bold text-yumrun-orange">2</span>
                </div>
                <h3 className="mb-2 font-semibold">Place Your Order</h3>
                <p className="text-sm">Select your favorite dishes and place your order with just a few clicks</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
                  <span className="text-2xl font-bold text-yumrun-orange">3</span>
                </div>
                <h3 className="mb-2 font-semibold">Enjoy Your Meal</h3>
                <p className="text-sm">Track your order in real-time and enjoy delicious food delivered to your door</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default About; 