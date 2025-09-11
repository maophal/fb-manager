export default function Footer() {
  return (
    <footer className="bg-gray-800 p-4 text-white mt-8">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} Facebook Manager Tool. All rights reserved.</p>
      </div>
    </footer>
  );
}