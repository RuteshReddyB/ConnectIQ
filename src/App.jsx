import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, serverTimestamp, orderBy } from 'firebase/firestore';
import { Sun, Moon, LayoutDashboard, Send, BarChart2, Settings, Zap, Facebook, Instagram, Twitter, Linkedin, Cloud, MessageSquare, LogIn, X, Clock, Image, Upload, Menu, Phone, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, ThumbsUp, MessageSquare as CommentIcon, Share2, TrendingUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// --- GLOBAL FIREBASE VARIABLE SETUP (MANDATORY) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; 

// --- MOCK DATA AND CONSTANTS ---

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', hover: 'hover:bg-blue-700', description: 'Schedule posts and track page performance.' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600', hover: 'hover:bg-pink-700', description: 'Publish Reels, Stories, and carousel posts.' },
  // REMOVED: { id: 'twitter', name: 'Twitter (X)', icon: Twitter, color: 'bg-sky-500', hover: 'hover:bg-sky-600', description: 'Monitor engagement and publish tweets.' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-sky-700', hover: 'hover:bg-sky-800', description: 'Manage company pages and professional profiles.' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, color: 'bg-green-600', hover: 'hover:bg-green-700', description: 'Manage customer communications via WhatsApp API.' },
  { id: 'onedrive', name: 'OneDrive', icon: Cloud, color: 'bg-blue-500', hover: 'hover:bg-blue-600', description: 'Access media files directly from cloud storage.' },
];

// UPDATED MOCK ANALYTICS: All values set to 0
const MOCK_ANALYTICS = [
  { platform: 'Facebook', posts: 0, reach: 0, engagement: 0 }, 
  { platform: 'Instagram', posts: 0, reach: 0, engagement: 0 },
  { platform: 'WhatsApp', posts: 0, reach: 0, engagement: 0 }, 
  { platform: 'LinkedIn', posts: 0, reach: 0, engagement: 0 },
];

const MOCK_TRENDING_CONTENT = [
    { id: 1, platformId: 'instagram', title: 'Sunset Views from Bali', metrics: { likes: '1.2K', comments: 85, shares: 120 }, imageUrl: 'https://picsum.photos/id/1015/300/200', summary: 'Gorgeous 4K reel showcasing the best hidden beaches and local cuisine in Bali. Check out the top spots for photography!' },
    { id: 2, platformId: 'facebook', title: 'New Product Launch Video', metrics: { likes: '3.5K', comments: 410, shares: 900 }, imageUrl: 'https://picsum.photos/id/200/300/200', summary: 'See how our latest software update streamlines your workflow. Early customer feedback has been overwhelmingly positive—watch the full demo now.' },
    { id: 3, platformId: 'twitter', title: '#TechTrends 2025 Prediction', metrics: { likes: '8.1K', comments: 1.1, shares: '2.4K' }, imageUrl: 'https://picsum.photos/id/250/300/200', summary: 'A bold prediction thread on the future of generative AI and its impact on creative industries. Join the debate with your own predictions.' },
    { id: 4, platformId: 'linkedin', title: 'Leadership Workshop Summary', metrics: { likes: 500, comments: 22, shares: 15 }, imageUrl: 'https://picsum.photos/id/160/300/200', summary: 'Key takeaways from our recent workshop on ethical leadership in remote teams. Focus points include communication strategies and trust-building.' },
    { id: 5, platformId: 'instagram', title: 'Travel Vlog Episode 2', metrics: { likes: 980, comments: 45, shares: 60 }, imageUrl: 'https://picsum.photos/id/1040/300/200', summary: 'Our second episode explores sustainable travel practices in Patagonia. Learn how to minimize your environmental footprint on your next adventure.' },
    { id: 6, platformId: 'twitter', title: 'Breaking News: AI Update', metrics: { likes: '15K', comments: 3.2, shares: '5.1K' }, imageUrl: 'https://picsum.photos/id/270/300/200', summary: 'Latest regulatory news regarding large language models (LLMs) in Europe. The market reacted strongly to the announcement this morning.' },
    { id: 7, platformId: 'facebook', title: 'Viral Recipe Video - 5 Minute Meals', metrics: { likes: '2.1K', comments: 110, shares: 350 }, imageUrl: 'https://picsum.photos/id/150/300/200', summary: 'The simplest one-pot pasta recipe that took the culinary world by storm! Perfect for busy weeknights.' }, // Changed to ID 150 which loads reliably
    { id: 8, platformId: 'linkedin', title: 'Remote Work Policy Announcement', metrics: { likes: 320, comments: 9, shares: 5 }, imageUrl: 'https://picsum.photos/id/10/300/200', summary: 'Official announcement of our transition to a fully hybrid work model. See the details of the policy update inside.' },
    { id: 9, platformId: 'instagram', title: 'Gym Motivation Reel', metrics: { likes: '6.8K', comments: 195, shares: 80 }, imageUrl: 'https://picsum.photos/id/1060/300/200', summary: 'New workout routine dropped! Targeting core strength and endurance. Tag a gym buddy!' },
    { id: 10, platformId: 'twitter', title: 'Cryptocurrency Crash Analysis', metrics: { likes: '12K', comments: 4.5, shares: '3.1K' }, imageUrl: 'https://picsum.photos/id/1050/300/200', summary: 'Detailed analysis of the market correction in Bitcoin and Ethereum. Is this a buying opportunity or the start of a bear market?' },
];

const INTEREST_FIELDS = [
    'Adventure', 'Animals', 'Art', 'Artificial Intelligence', 'Astrophysics', 
    'Automotive', 'Business', 'Comedy', 'Cooking', 'Crafts', 
    'Cryptocurrency', 'Culture', 'DIY/Home Improvement', 'Education', 'Environmental Science', 
    'Fashion', 'Finance', 'Fitness', 'Food & Drink', 'Gaming', 
    'Health', 'History', 'Home Design', 'Investing', 'Language Learning', 
    'Literature', 'Movies', 'Music', 'News', 'Photography', 
    'Podcasts', 'Science', 'Space Exploration', 'Sports', 'Startups', 
    'Technology', 'Travel', 'Video Games', 'Volunteering', 'Wellness'
].sort();


/**
 * Custom hook for Firebase Initialization and Authentication
 */
const useFirebase = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authService = getAuth(app);

      setDb(firestore);
      setAuth(authService);

      const unsubscribe = onAuthStateChanged(authService, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          // Attempt sign in with custom token or anonymously
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(authService, initialAuthToken);
            } else {
              await signInAnonymously(authService);
            }
          } catch (error) {
            console.error("Firebase Auth Error:", error);
            // Fallback for environments where auth isn't available
            setUserId(crypto.randomUUID());
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase Initialization Failed:", e);
      // Fallback for environments without Firebase config
      setDb({});
      setAuth({});
      setUserId(crypto.randomUUID());
    }
  }, []);

  return { db, auth, userId, isAuthReady: !!userId };
};

/**
 * Saves or updates the user's interest preference to Firestore.
 */
const saveInterestsPreference = async (db, userId, interests) => {
    if (!db || !userId) return false;
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/preferences/onboarding`);
    try {
        await setDoc(docRef, { interestsCompleted: true, selectedInterests: interests, updatedAt: serverTimestamp() }, { merge: true });
        console.log("Interests saved to Firestore.");
        return true;
    } catch (e) {
        console.error("Error saving interest preference:", e);
        return false;
    }
};

/**
 * Saves the current theme preference to Firestore.
 */
const saveThemePreference = async (db, userId, isDarkMode) => {
  if (!db || !userId) return;
  const docRef = doc(db, `artifacts/${appId}/users/${userId}/preferences/theme`);
  try {
    await setDoc(docRef, { isDarkMode, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.error("Error saving theme preference:", e);
  }
};

/**
 * Component for the Dark/Light Mode Toggle
 */
const ThemeToggle = ({ isDarkMode, toggleTheme }) => {
  const Icon = isDarkMode ? Sun : Moon; 
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
      aria-label="Toggle Dark Mode"
    >
      <Icon size={20} />
    </button>
  );
};

// --- Calendar Component ---

const CalendarView = () => {
    // Initialize state with current month and year
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [error, setError] = useState(null);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    // Get number of days in the current month
    const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
    // Get the index of the first day of the month (0=Sun, 1=Mon, etc.)
    const startDayIndex = currentDate.getDay(); 
    
    const totalCells = startDayIndex + daysInMonth;
    const weeks = Math.ceil(totalCells / 7);

    const dates = [];
    // Add leading blank days
    for (let i = 0; i < startDayIndex; i++) {
        dates.push(null);
    }
    // Add month days
    for (let i = 1; i <= daysInMonth; i++) {
        dates.push(i);
    }
    // Add trailing blank days to fill the last week
    while (dates.length < weeks * 7) {
        dates.push(null);
    }

    const navigateMonth = useCallback((amount) => {
        setError(null);
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate.getTime());
            newDate.setMonth(prevDate.getMonth() + amount);
            
            // Optional: Basic validation to prevent decades of navigation
            if (newDate.getFullYear() < 2000 || newDate.getFullYear() > 2100) {
                setError("Navigation limited to years between 2000 and 2100.");
                return prevDate;
            }

            // Reset day to 1 to prevent month skipping issues (e.g., navigating from 31st Jan to Feb)
            newDate.setDate(1); 
            return newDate;
        });
    }, []);

    const navigateYear = useCallback((amount) => {
        setError(null);
        setCurrentDate(prevDate => {
            const newYear = prevDate.getFullYear() + amount;
            
            if (newYear < 2000 || newYear > 2100) {
                setError("Navigation limited to years between 2000 and 2100.");
                return prevDate;
            }

            const newDate = new Date(prevDate.getTime());
            newDate.setFullYear(newYear);
              // Reset day to 1 to prevent issues
            newDate.setDate(1); 
            return newDate;
        });
    }, []);


    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
                    Content Calendar View
                </h2>
                <div className="flex items-center justify-between mt-2">
                    {/* Previous Year Button */}
                    <button
                        onClick={() => navigateYear(-1)}
                        className="p-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Previous Year"
                    >
                        <ChevronsLeft size={20} />
                    </button>

                    {/* Previous Month Button */}
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Previous Month"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {/* Month & Year Display */}
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400 mx-4 w-32 text-center select-none">
                        {monthName} {currentYear}
                    </span>

                    {/* Next Month Button */}
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Next Month"
                    >
                        <ChevronRight size={20} />
                    </button>
                    
                    {/* Next Year Button */}
                    <button
                        onClick={() => navigateYear(1)}
                        className="p-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Next Year"
                    >
                        <ChevronsRight size={20} />
                    </button>
                </div>
                    {/* Error Message Display */}
                {error && (
                    <div className="mt-2 p-2 text-sm text-center text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg border border-red-300 flex items-center justify-center">
                        <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-sm mb-1">
                {daysOfWeek.map((day, index) => (
                    <div 
                        key={day} 
                        className={`py-1 rounded-lg ${
                            index === 0 || index === 6 // Sun and Sat
                            ? 'text-red-500 dark:text-red-400' 
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Date Grid */}
            <div className="flex-1 grid grid-cols-7 gap-1 overflow-y-auto">
                {dates.map((date, index) => {
                    const isWeekend = index % 7 === 0 || (index + 1) % 7 === 0;
                    const isToday = date === today.getDate() && currentDate.getMonth() === today.getMonth() && currentYear === today.getFullYear();

                    return (
                        <div
                            key={index}
                            className={`p-1 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[80px] text-xs transition-colors duration-200 cursor-pointer ${
                                isToday ? 'bg-blue-100 dark:bg-blue-900/70 border-blue-500 ring-2 ring-blue-500/50' : ''
                            } ${
                                isWeekend && !isToday
                                    ? 'bg-gray-50/50 dark:bg-gray-700/50' 
                                    : !isToday ? 'bg-white dark:bg-gray-800' : ''
                            } ${
                                !date ? 'opacity-50 pointer-events-none' : ''
                            } hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400`}
                        >
                            <div className={`font-semibold ${isToday ? 'text-blue-700 dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'}`}>
                                {date}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- MODIFIED AnalyticsCard for dynamic WhatsApp labels ---
const AnalyticsCard = ({ platform, posts, reach, engagement, color }) => {
  const isWhatsApp = platform === 'WhatsApp';
  
  // Dynamic Labels
  const postsLabel = isWhatsApp ? 'Sent Messages' : 'Posts';
  const reachLabel = isWhatsApp ? 'Delivery Rate' : 'Reach';
  const engagementLabel = isWhatsApp ? 'User Replies' : 'Engagement';

  // Dynamic Values & Formatting
  const reachValue = isWhatsApp ? `${reach.toFixed(1)}%` : reach.toLocaleString();
  const engagementValue = engagement.toLocaleString();
  const postsCount = posts.toLocaleString();

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition duration-300 transform hover:scale-[1.02]">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{platform}</h3>
        {/* Uses generic 'posts' variable but dynamic label 'postsLabel' */}
        <span className={`px-3 py-1 text-sm font-medium rounded-full text-white ${color}`}>{postsCount} {postsLabel}</span>
        </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">{reachLabel}</p>
          {/* Uses dynamic 'reachValue' */}
          <p className={`text-xl font-bold ${isWhatsApp ? 'text-green-500' : 'text-green-500'}`}>{reachValue}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{engagementLabel}</p>
          {/* Uses dynamic 'engagementValue' */}
          <p className="text-xl font-bold text-purple-500">{engagementValue}</p>
        </div>
      </div>
    </div>
  );
};
// --- END MODIFIED AnalyticsCard ---


const ScheduledPostItem = ({ post }) => (
  <div className="flex items-center justify-between p-3 mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
    <div className="flex items-center space-x-3">
      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
        {new Date(post.scheduledTime.seconds * 1000).toLocaleTimeString()}
      </div>
      <div className="text-sm font-medium truncate max-w-xs">{post.content.substring(0, 50)}...</div>
    </div>
    <div className="flex space-x-1">
      {post.platforms.map(pId => {
        const platform = PLATFORMS.find(p => p.id === pId);
        if (!platform) return null;
        const Icon = platform.icon;
        return <Icon key={pId} size={16} className={`text-white p-0.5 rounded ${platform.color}`} title={platform.name} />;
      })}
    </div>
  </div>
);

const ScheduledPostsPanel = ({ scheduledPosts }) => (
  <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl h-full flex flex-col">
    <h2 className="text-2xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
      <Clock className="inline mr-2 h-5 w-5" /> Scheduled Posts
      <span className="text-sm font-medium text-blue-600 dark:text-blue-400 ml-2">({scheduledPosts.length})</span>
    </h2>
    <div className="flex-1 overflow-y-auto pr-2">
      {scheduledPosts.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          No posts scheduled yet! Click 'New Post' to start.
          </div>
      ) : (
        scheduledPosts.map((post, index) => <ScheduledPostItem key={index} post={post} />)
      )}
    </div>
  </div>
);

// --- Composer Modal (Simplified) ---

const ComposerModal = ({ isOpen, onClose, db, userId }) => {
    const fileInputRef = useRef(null);
    const [content, setContent] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null); // Stores the URL for preview
    const [imageError, setImageError] = useState(null);

    const MAX_FILE_SIZE_MB = 5;
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        setImageError(null);
        const file = event.target.files[0];
        
        if (!file) return;

        // 1. Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            setImageError(`Unsupported file type: ${file.type}. Please use JPEG, PNG, or GIF.`);
            setUploadedImage(null);
            return;
        }

        // 2. Validate file size
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            setImageError(`File size exceeds limit (${MAX_FILE_SIZE_MB}MB).`);
            setUploadedImage(null);
            return;
        }

        // 3. Display preview and mock upload
        setUploadedImage(URL.createObjectURL(file));
        
        // Mock uploading state
        // In a real app, this is where you'd call Firebase Storage or other upload API
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            console.log(`Image "${file.name}" mock uploaded successfully.`);
        }, 1500);
    };

    const togglePlatform = (id) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSchedule = async () => {
        if (!content.trim() || selectedPlatforms.length === 0 || !db || !userId) {
            console.error("Missing content, platforms, or DB connection.");
            return;
        }

        setLoading(true);
        const scheduledTime = new Date(Date.now() + 600000); // Mock scheduling 10 minutes from now

        try {
            const docRef = doc(collection(db, `artifacts/${appId}/users/${userId}/scheduled_posts`));
            await setDoc(docRef, {
                content: content.trim(),
                platforms: selectedPlatforms,
                image: uploadedImage, // Mock image URL storage
                scheduledTime: scheduledTime,
                status: 'scheduled',
                createdAt: serverTimestamp(),
            });
            console.log("Post scheduled successfully!");
            
            // Cleanup
            onClose();
            setContent('');
            setSelectedPlatforms([]);
            setUploadedImage(null); 
        } catch (e) {
            console.error("Error scheduling post:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Clean up the object URL when modal is closed
        if (uploadedImage) {
            URL.revokeObjectURL(uploadedImage);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 dark:bg-opacity-80 p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-2xl p-6 transition-all duration-300 transform scale-100 relative">
                {/* New Dismiss 'X' Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    aria-label="Close composer"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100 border-b pb-2">New Post Composer</h3>

                {/* Image Preview Area */}
                {uploadedImage && (
                    <div className="mb-4 relative">
                        <img 
                            src={uploadedImage} 
                            alt="Uploaded media preview" 
                            className="max-h-48 w-full object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                        />
                        <button 
                            onClick={() => { URL.revokeObjectURL(uploadedImage); setUploadedImage(null); }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-700 transition"
                            aria-label="Remove uploaded image"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* File Error Message */}
                {imageError && (
                    <div className="mb-4 p-3 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg border border-red-300">
                        {imageError}
                    </div>
                )}

                {/* Text Area and Upload Button Wrapper */}
                <div className="relative mb-4">
                    {/* Hidden File Input (Accessibility) */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept={ALLOWED_MIME_TYPES.join(',')}
                        className="hidden" 
                        id="image-upload-input" 
                        aria-label="File selector for image upload"
                    />
                    
                    {/* Upload Button */}
                    <label 
                        htmlFor="image-upload-input"
                        onClick={triggerFileInput} 
                        className="absolute left-2 top-2 px-3 py-1.5 flex items-center bg-white dark:bg-gray-700 rounded-lg shadow-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-semibold text-blue-600 dark:text-blue-400"
                        aria-label="Upload Image"
                    >
                        {loading ? <Upload size={16} className="mr-2 animate-pulse" /> : <Image size={16} className="mr-2" />}
                        Upload Image
                    </label>

                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What would you like to post? (Supports media attached above)"
                        rows="6"
                        className="w-full p-3 pt-12 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Select Platforms</label>
                    <div className="flex flex-wrap gap-2">
                        {PLATFORMS.filter(p => p.id !== 'onedrive').map(platform => {
                            const Icon = platform.icon;
                            const isSelected = selectedPlatforms.includes(platform.id);
                            return (
                                <button
                                    key={platform.id}
                                    onClick={() => togglePlatform(platform.id)}
                                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                        isSelected
                                            ? `${platform.color} text-white shadow-lg shadow-gray-500/50 dark:shadow-blue-500/20`
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <Icon size={16} className="mr-2" />
                                    {platform.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSchedule}
                        className={`px-4 py-2 text-white rounded-lg transition-colors duration-200 ${
                            loading || selectedPlatforms.length === 0
                                ? 'bg-blue-400 dark:bg-blue-600 opacity-60 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-md shadow-blue-500/50'
                        }`}
                        disabled={loading || selectedPlatforms.length === 0}
                    >
                        {loading ? 'Scheduling...' : 'Schedule Post'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Login Modal (Admin Access) ---

const LoginModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleOAuth = (provider) => {
        console.log(`Initiating mock OAuth login for ${provider}...`);
        // In a real app, this would trigger Firebase signInWithPopup(auth, provider)
        // For demonstration, we close the modal after a short delay.
        setTimeout(() => {
            onClose();
            console.log("Mock login flow completed. User would now be signed in.");
        }, 500);
    };

    const GoogleIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" className="mr-3">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.343c-1.77,2.677-4.92,4.516-8.843,4.516c-6.6,0-11.983-5.383-11.983-11.983c0-6.6,5.383-11.983,11.983-11.983c3.342,0,6.48,1.442,8.665,3.771l6.096-6.096C38.006,5.138,32.748,3,24,3C12.44,3,3,12.44,3,24c0,11.56,9.44,21,21,21c9.47,0,16.529-6.521,17.158-17.917L43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691L1.401,9.786C4.888,5.432,9.757,3,15,3c8.156,0,13.298,5.08,13.298,5.08L22.997,14.51C20.628,11.323,17.47,9.516,13.543,9.516C8.82,9.516,4.86,12.783,3.31,17.373L6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,45c6.883,0,12.593-3.267,16.634-7.857L33.729,32.14c-1.928,2.837-5.086,4.86-8.729,4.86c-4.723,0-8.683-3.267-10.233-7.857L6.306,33.309C10.65,39.816,17.44,45,24,45z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.343c-1.181,1.866-2.915,3.197-4.843,3.743c-2.091,0.612-4.188,0.76-6.177,0.443L6.306,33.309L3.31,30.597c2.618-5.719,7.668-9.088,14.69-9.088c4.29,0,8.349,1.673,11.141,4.402L39.167,14.73C34.549,10.655,29.349,9.516,24,9.516c4.608,0,8.966,1.444,12.454,3.772l3.771-3.771c-3.149-2.73-7.391-4.402-12.225-4.402c-7.25,0-13.67,3.615-17.387,9.088L1.401,9.786C4.888,5.432,9.757,3,15,3c8.611,0,15.611,6.864,16.892,16.083H43.611z"/>
        </svg>
    );

    const MicrosoftIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20px" height="20px" className="mr-3">
            <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
            <rect x="13" y="1" width="10" height="10" fill="#7fba00"/>
            <rect x="1" y="13" width="10" height="10" fill="#00a4ef"/>
            <rect x="13" y="13" width="10" height="10" fill="#ffb900"/>
        </svg>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 dark:bg-opacity-80 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-xl shadow-2xl p-6 transition-all duration-300 transform scale-100 relative">
                {/* Dismiss 'X' Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    aria-label="Close login modal"
                >
                    <X size={20} />
                </button>

                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">
                    Admin Login
                </h3>

                <div className="space-y-4">
                    <button
                        onClick={() => handleOAuth('Google')}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Sign in with Google"
                    >
                        <GoogleIcon />
                        Sign in with Google
                    </button>
                    <button
                        onClick={() => handleOAuth('Microsoft')}
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Sign in with Microsoft"
                    >
                        <MicrosoftIcon />
                        Sign in with Microsoft
                    </button>
                </div>
                <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    Only authorized administrators should proceed.
                </p>
            </div>
        </div>
    );
};


// --- SideBar Component ---
const Sidebar = ({ isDarkMode, handleNavClick, isSidebarOpen, toggleSidebar, view }) => {
    // Determine the color of "Connect" based on dark mode state
    const connectColorClass = isDarkMode ? 'text-gray-100' : 'text-blue-600';
    
    const sidebarWidth = isSidebarOpen ? 'w-64' : 'w-20';
    const paddingClass = isSidebarOpen ? 'p-4' : 'p-3';

    // The Menu icon acts as the toggle button
    const ToggleButton = () => (
        <button
            onClick={toggleSidebar}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
            <Menu size={24} />
        </button>
    );

    const NavItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
        { name: 'Composer', icon: Send, path: 'composer' },
        { name: 'Analytics', icon: BarChart2, path: 'analytics' },
        { name: 'Integrations', icon: Zap, path: 'integrations_page' },
        { name: 'Trending', icon: TrendingUp, path: 'trending_panel' }, // NEW TRENDING PATH
        { name: 'Settings', icon: Settings, path: 'settings' },
    ];

    return (
        <div 
            className={`hidden md:flex flex-col ${sidebarWidth} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl transition-all duration-300 ease-in-out h-full`}
        >
            {/* Header / Logo Section - FIXED BUG HERE */}
            <div className={`flex items-center h-16 mb-6 border-b border-gray-200 dark:border-gray-800 ${isSidebarOpen ? 'justify-between px-4' : 'justify-center py-3 flex-col space-y-1'}`}>
                {isSidebarOpen ? (
                    <>
                        {/* Expanded State: Title on left, Button on right (justify-between) */}
                        <h1 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                            <span className={connectColorClass}>Connect</span>IQ
                        </h1>
                        <ToggleButton />
                    </>
                ) : (
                    <>
                        {/* Collapsed State: Icon (top) + Button (bottom) (flex-col stacked, justify-center overall) */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-400 text-white font-extrabold text-xl mb-1" aria-label="ConnectIQ">
                            IQ
                        </div>
                        {/* FIX: Explicitly render Button in collapsed state */}
                        <ToggleButton />
                    </>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-2">
                {NavItems.map((item) => {
                    // FIX: Use the passed 'view' state to determine the current active link
                    const isCurrent = item.path === view; 
                    
                    return (
                        <button
                            key={item.name}
                            onClick={() => handleNavClick(item.path)}
                            className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors group ${paddingClass} ${
                                isCurrent
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                            title={!isSidebarOpen ? item.name : undefined} // Tooltip when closed
                            aria-current={isCurrent ? 'page' : undefined}
                        >
                            {/* Icon Styling: Inherits 'text-white' from active state or 'text-gray-600/300' from inactive state */}
                            <item.icon className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                            {isSidebarOpen && item.name}
                            
                            {/* Hidden text for screen readers when closed */}
                            {!isSidebarOpen && (
                                <span className="sr-only">{item.name}</span>
                            )}
                        </button>
                    );
                })}
            </nav>
            
            {/* User ID Footer (Collapsed/Expanded) */}
            <div className={`mt-auto pt-4 border-t border-gray-200 dark:border-gray-800 ${isSidebarOpen ? 'text-left px-4' : 'text-center'}`}>
                {isSidebarOpen && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 break-all">App ID: {appId}</p>
                )}
                {!isSidebarOpen && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 rotate-90 w-4 mx-auto my-3">App ID</p>
                )}
            </div>
        </div>
    );
};

// --- TopBar Component ---
const TopBar = ({ toggleTheme, isDarkMode, userId, openComposer, openLoginModal }) => (
  <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
    <div className="md:hidden text-2xl font-extrabold text-blue-600 dark:text-blue-400">ConnectIQ</div>
    
    {/* Search Bar - Shortened and Centered */}
    <div className="flex-1 flex justify-center max-w-lg mx-auto hidden sm:block">
      <input
        type="text"
        placeholder="Search posts, metrics, or settings..."
        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100"
      />
    </div>

    {/* Action Items */}
    <div className="flex items-center space-x-3 ml-4">
      <button
          onClick={openComposer}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors text-sm font-semibold"
      >
          <Send className="w-4 h-4 mr-2" /> New Post
      </button>

      {/* Admin Login Button (Replaced Profile Icon) */}
      <button
          onClick={openLoginModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors text-sm font-semibold"
          aria-label="Admin Login"
      >
          <LogIn className="w-4 h-4 mr-2" /> Login
      </button>

      <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
    </div>
  </header>
);

// --- Interest Selection View Component ---

const InterestSelectionView = ({ onComplete, db, userId, isDarkMode }) => {
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const MIN_SELECTION = 3;

    const handleToggleInterest = (interest) => {
        setSelectedInterests(prev => 
            prev.includes(interest) 
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
        setError(null); // Clear error on interaction
    };

    const handleSubmit = async () => {
        if (selectedInterests.length < MIN_SELECTION) {
            setError(`Please select at least ${MIN_SELECTION} fields.`);
            return;
        }

        setLoading(true);
        setError(null);

        // 1. Save preferences to Firestore (mock persistence)
        const success = await saveInterestsPreference(db, userId, selectedInterests);

        setLoading(false);
        
        if (success) {
            // 2. Transition to the main dashboard
            onComplete(true);
        } else {
            setError("Failed to save preferences. Please try again.");
        }
    };

    // Determine card background based on overall theme
    const cardBgClass = isDarkMode ? 'bg-gray-800' : 'bg-white';

    return (
        <div className={`flex items-center justify-center flex-1 p-4 sm:p-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className={`w-full max-w-2xl ${cardBgClass} rounded-xl shadow-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700`}>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2 text-center">
                    Welcome to ConnectIQ!
                </h1>
                <p className="text-center text-lg text-gray-600 dark:text-gray-400 mb-6">
                    To personalize your dashboard and recommendations, please select your primary fields of interest.
                </p>
                
                <label className="block text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    In which fields are you more interested in?
                </label>

                {/* Dynamic Interest List Container */}
                <div 
                    className="max-h-80 overflow-y-auto pr-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3"
                    aria-required="true"
                    aria-describedby="error-message-interest"
                    role="group"
                >
                    {INTEREST_FIELDS.map(field => {
                        const isSelected = selectedInterests.includes(field);
                        return (
                            <label 
                                key={field}
                                htmlFor={`interest-${field}`}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-150 
                                    ${isSelected 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 ring-2 ring-blue-500/50' 
                                        : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                tabIndex="0"
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggleInterest(field) }}
                            >
                                <span className="text-gray-800 dark:text-gray-200 flex-1 mr-3 font-medium">
                                    {field}
                                </span>
                                <input
                                    type="checkbox"
                                    id={`interest-${field}`}
                                    name="interest"
                                    value={field}
                                    checked={isSelected}
                                    onChange={() => handleToggleInterest(field)}
                                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                                    aria-checked={isSelected}
                                />
                            </label>
                        );
                    })}
                </div>

                {/* Error Message Display */}
                {error && (
                    <div id="error-message-interest" className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-lg text-sm font-medium transition-all duration-300 flex items-center" role="alert">
                        <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}


                {/* Submit Button Container (Bottom Right) */}
                <div className="flex justify-end mt-6">
                    <button 
                        onClick={handleSubmit}
                        disabled={loading || selectedInterests.length < MIN_SELECTION}
                        className={`px-8 py-3 text-white font-semibold rounded-xl shadow-lg transition duration-150 transform hover:scale-[1.02] flex items-center justify-center
                            ${loading || selectedInterests.length < MIN_SELECTION
                                ? 'bg-blue-400 cursor-not-allowed opacity-75'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/50 dark:bg-blue-500 dark:hover:bg-blue-600'
                            }`}
                    >
                        {loading ? (
                            <>
                                <Clock size={20} className="animate-spin mr-2" />
                                Saving Selections...
                            </>
                        ) : (
                            <>
                                Submit and Go to Dashboard 
                                <ArrowRight size={20} className="ml-2" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Integrations Status Panel (Dashboard Footer) ---
const IntegrationsStatusPanel = React.forwardRef(({ platformConnections, isTargetingIntegrations }, ref) => (
    // Pass platformConnections prop
    <div 
        ref={ref} 
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 transition-all duration-500 ${isTargetingIntegrations ? 'ring-4 ring-yellow-400/50 dark:ring-yellow-300/50' : ''}`}
    >
      <h2 className="text-2xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
        Integrations Status
      </h2> 
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {PLATFORMS.map(platform => {
          const Icon = platform.icon;
          // READ from platformConnections state
          const isConnected = platformConnections[platform.id] || false; 
          return (
            <div key={platform.id} className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className={`p-2 rounded-full ${platform.color} mb-2`}>
                <Icon size={24} className="text-white" />
              </div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{platform.name}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          );
        })}
        </div>
    </div>
));


// --- Trending Content Component (Displayed on Dashboard) ---
const TrendingContent = ({ openTrendingModal }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
        <h2 className="text-2xl font-extrabold mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
            🔥 Top Trending Posts
        </h2>
        {/* REMOVED SLICE: Now displays all 10 mock trending entries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MOCK_TRENDING_CONTENT.map((post) => {
                const platform = PLATFORMS.find(p => p.id === post.platformId);
                const Icon = platform ? platform.icon : Zap;
                
                return (
                    <div 
                        key={post.id} 
                        onClick={() => openTrendingModal(post.platformId)}
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:shadow-xl hover:ring-2 ring-blue-500 transition duration-200 transform hover:scale-[1.02]"
                        aria-label={`View trending post from ${platform ? platform.name : 'Platform'}`}
                        role="button"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100" title={post.title}>
                                {post.title}
                            </h4>
                            <div className={`p-1 rounded-full ${platform ? platform.color : 'bg-gray-500'}`}>
                                <Icon size={14} className="text-white" />
                            </div>
                        </div>
                        
                        {/* Image Preview instead of text */}
                        <div className="h-20 mb-3 overflow-hidden rounded-md">
                            {post.imageUrl ? (
                                <img src={post.imageUrl} alt={`Thumbnail for ${post.title}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="bg-gray-200 dark:bg-gray-900 h-full flex items-center justify-center">
                                    <p className="text-xs text-gray-500">No Image</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                                <ThumbsUp size={12} className="mr-1 text-red-500" /> {post.metrics.likes}
                            </span>
                            <span className="flex items-center">
                                <CommentIcon size={12} className="mr-1 text-yellow-500" /> {post.metrics.comments}
                            </span>
                            <span className="flex items-center">
                                <Share2 size={12} className="mr-1 text-blue-500" /> {post.metrics.shares}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);


// --- NEW DEDICATED TRENDING CONTENT VIEW ---
const TrendingSidebarContent = ({ openTrendingModal }) => (
    <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 min-h-[500px]">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">
                <TrendingUp className="inline mr-2 h-7 w-7 text-red-500" /> Global Trending Feed
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
                Explore the top **{MOCK_TRENDING_CONTENT.length}** performing posts across all platforms, updated hourly. Click any post to view details and integrate your account.
            </p>
            <ol className="space-y-4">
                {/* Show all 10 mock trending items here */}
                {MOCK_TRENDING_CONTENT.map((post, index) => {
                    const platform = PLATFORMS.find(p => p.id === post.platformId);
                    const Icon = platform ? platform.icon : Zap;
                    
                    return (
                        <li 
                            key={post.id} 
                            onClick={() => openTrendingModal(post.platformId)}
                            className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 cursor-pointer hover:shadow-lg hover:ring-1 ring-blue-500 transition duration-200"
                            aria-label={`${post.title} ranking #${index + 1}`}
                        >
                            <span className="text-2xl font-black mr-4 text-blue-600 dark:text-blue-400 w-8 flex-shrink-0 text-right">{index + 1}.</span>
                            
                            {/* Thumbnail */}
                            <div className="w-16 h-16 mr-4 overflow-hidden rounded-md flex-shrink-0">
                                {post.imageUrl ? (
                                    <img src={post.imageUrl} alt={`Thumbnail for ${post.title}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="bg-gray-200 dark:bg-gray-900 w-full h-full flex items-center justify-center text-xs text-gray-500">Image</div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center mb-1">
                                    <Icon size={14} className={`mr-2 ${platform ? platform.color.replace('bg', 'text') : 'text-gray-500'}`} />
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate" title={post.title}>
                                        {post.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                    {post.summary}
                                </p>
                                
                                {/* Metrics */}
                                <div className="flex space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center">
                                        <ThumbsUp size={12} className="mr-1 text-red-500" /> {post.metrics.likes}
                                    </span>
                                    <span className="flex items-center">
                                        <CommentIcon size={12} className="mr-1 text-yellow-500" /> {post.metrics.comments}
                                    </span>
                                    <span className="flex items-center">
                                        <Share2 size={12} className="mr-1 text-blue-500" /> {post.metrics.shares}
                                    </span>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ol>
            
            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Criteria:</strong> Trending status is determined by real-time engagement rate (Likes, Shares, Comments) over the last 4 hours.</p>
                <p className="mt-1"><strong>Update:</strong> Feed refreshes every 60 minutes.</p>
            </div>
        </div>
    </div>
);


const DashboardContent = ({ scheduledPosts, integrationsRef, isTargetingIntegrations, openTrendingModal, platformConnections }) => (
  <div className="p-6 space-y-6">
    {/* TITLE: Welcome to ConnectIQ */}
    <h1 className="text-3xl font-extrabold">
        Welcome to 
        <span className="text-gray-900 dark:text-gray-100"> Connect</span>
        <span className="text-blue-600 dark:text-blue-400">IQ</span>
    </h1>

    {/* Section 1: Quick Analytics Summary (Now includes WhatsApp) */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_ANALYTICS.map(data => (
            <AnalyticsCard key={data.platform} {...data} color={PLATFORMS.find(p => p.name === data.platform)?.color || 'bg-gray-500'} />
        ))}
    </div>

    {/* Section 2: Composer and Calendar/Scheduled Posts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> 
      <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl min-h-[500px]"> 
          <CalendarView />
      </div>
      <ScheduledPostsPanel scheduledPosts={scheduledPosts} />
    </div>
    
    {/* Section 3: Integrations Status Panel */}
    <IntegrationsStatusPanel 
        ref={integrationsRef}
        platformConnections={platformConnections} // PASS state here
        isTargetingIntegrations={isTargetingIntegrations}
    />
    
    {/* Section 4: Trending Content Panel (Mini-version on Dashboard) */}
    <TrendingContent openTrendingModal={openTrendingModal} />
  </div>
);

// --- Trending Authentication Modal ---
const TrendingAuthModal = ({ isOpen, onClose, platformId, onConnect }) => {
    if (!isOpen || !platformId) return null;

    const platform = PLATFORMS.find(p => p.id === platformId);
    if (!platform) return null;

    const Icon = platform.icon;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [saveCredentials, setSaveCredentials] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLoginAttempt = () => {
        setError(null);
        if (!username || !password) {
            setError("Please enter both your username/email and password.");
            return;
        }

        setLoading(true);

        // Mock Authentication Logic
        setTimeout(() => {
            setLoading(false);
            if (password === 'test1234') { // Mock Success
                console.log(`Successfully connected ${platform.name}. Credentials saved: ${saveCredentials}`);
                onConnect(platformId, true); // Trigger connection success with status=true
                onClose();
            } else {
                setError("Incorrect credentials. Please try again. (Hint: Use password 'test1234')");
            }
        }, 1500);
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 dark:bg-opacity-80 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl p-6 transition-all duration-300 transform scale-100 relative">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    aria-label="Close login modal"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full ${platform.color} mb-3`}>
                        <Icon size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Connect to Access Trending Content
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Log in to your **{platform.name}** account to view this post and related analytics.
                    </p>
                </div>

                {/* Error Handling */}
                {error && (
                    <div className="mb-4 p-3 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg border border-red-300 flex items-center">
                        <AlertTriangle size={18} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}
                
                {/* Login Form */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Username or Email</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="username@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Password"
                        />
                    </div>
                    
                    {/* Security/UX Options */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                            <input
                                id="save-credentials"
                                type="checkbox"
                                checked={saveCredentials}
                                onChange={(e) => setSaveCredentials(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="save-credentials" className="ml-2 text-gray-700 dark:text-gray-300">
                                Save credentials securely
                            </label>
                        </div>
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-xs">Forgot Password?</button>
                    </div>
                </div>

                {/* Call to Action */}
                <button
                    onClick={handleLoginAttempt}
                    disabled={loading}
                    className={`w-full mt-6 py-3 rounded-lg text-lg font-semibold text-white transition-colors ${
                        loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {loading ? 'Logging In...' : 'Securely Connect Account'}
                </button>

                {/* User Feedback Mechanism */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                    <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600">
                        Report Issue / Provide Feedback
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Full-Screen Integration View Component ---

const AuthFields = ({ platformId, loading, mobileNumber, setMobileNumber, otpInput, setOtpInput, handleSendOTP, handleVerifyOTP, handleLogin }) => {
    
    // Determine the type of authentication needed
    const isEmailPassword = ['facebook', 'linkedin', 'onedrive'].includes(platformId);
    const isUserIdPassword = ['instagram', 'twitter'].includes(platformId);
    const isWhatsApp = platformId === 'whatsapp';

    const [emailOrUser, setEmailOrUser] = useState('');
    const [password, setPassword] = useState('');
    const [otpFlow, setOtpFlow] = useState('phone_input'); // Re-initiate OTP flow state here for this component

    // --- Standard Login Fields (Email/Password or UserID/Password) ---
    if (isEmailPassword || isUserIdPassword) {
        const primaryLabel = isEmailPassword ? 'Email Address' : 'User ID';
        const primaryType = isEmailPassword ? 'email' : 'text';

        return (
            <div className="w-full">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {isEmailPassword ? 'Sign in using your account email and password.' : 'Sign in using your user ID and password.'}
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{primaryLabel}</label>
                        <input
                            type={primaryType}
                            value={emailOrUser}
                            onChange={(e) => setEmailOrUser(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder={`Enter ${primaryLabel}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Enter Password"
                        />
                    </div>
                </div>
                <button
                    onClick={() => handleLogin(platformId, emailOrUser, password)}
                    disabled={loading || !emailOrUser || !password}
                    className={`w-full mt-6 py-3 rounded-lg text-lg font-semibold text-white transition-colors ${
                        loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {loading ? 'Authenticating...' : 'Secure Login'}
                </button>
            </div>
        );
    }
    
    // --- WhatsApp OTP Fields (Mock Flow) ---
    if (isWhatsApp) {
        // NOTE: This area handles the WhatsApp flow, simplified for the full-screen view.
        
        const isOTPPhase = otpFlow === 'otp_verification';
        const isLocked = false; // Mocking lock state is complex, keeping simple here

        return (
            <div className="w-full">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Verify your WhatsApp number to establish a secure connection.
                </p>
                
                {/* Phone Number Input Phase */}
                {!isOTPPhase && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Mobile Number (with Country Code)</label>
                            <input
                                type="tel"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="+1234567890"
                            />
                        </div>
                        <button
                            onClick={() => { handleSendOTP(); setOtpFlow('otp_verification'); }}
                            disabled={loading || mobileNumber.length < 9}
                            className={`w-full mt-2 py-3 rounded-lg text-lg font-semibold text-white transition-colors ${
                                loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {loading ? 'Sending OTP...' : 'Send Verification Code'}
                        </button>
                    </div>
                )}

                {/* OTP Verification Phase */}
                {isOTPPhase && (
                    <div className="space-y-4 p-4 border border-green-300 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/50">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                            Enter the 6-digit code sent to **{mobileNumber}**.
                        </p>
                        <div>
                            <input
                                type="text"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                maxLength="6"
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center text-xl font-mono"
                                placeholder="------"
                                disabled={isLocked}
                            />
                        </div>
                           <button
                                onClick={handleVerifyOTP}
                                disabled={loading || otpInput.length !== 6 || isLocked}
                                className={`w-full py-3 rounded-lg text-lg font-semibold text-white transition-colors ${
                                    loading || isLocked ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                Verify & Connect
                            </button>
                            <button onClick={() => setOtpFlow('phone_input')} className="w-full mt-2 py-2 text-gray-700 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Change Number</button>
                    </div>
                )}
            </div>
        );
    }

    return <div className="text-red-500">Authentication method not defined for this platform.</div>;
};


const FullIntegrationView = ({ platformId, onBack, onComplete }) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    const [step, setStep] = useState(1); // 1: Permissions, 2: Authorization, 3: Success
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- WhatsApp State Management (Integrated) ---
    const [mobileNumber, setMobileNumber] = useState('');
    const [otpSent, setOtpSent] = useState('');
    const [otpInput, setOtpInput] = useState('');
    // --- End WhatsApp State Management ---

    if (!platform) {
        return <div className="p-10 text-red-500">Error: Platform not found.</div>;
    }

    const Icon = platform.icon;
    const steps = ['Grant Permissions', 'Authorize Account', 'Finalizing'];
    const progress = Math.min(step, steps.length);

    // --- Common Auth Handler for standard logins ---
    const handleLogin = (id, loginId, password) => {
        if (id === 'whatsapp') return; // Handled separately by OTP flow

        setLoading(true);
        setError(null);
        setStep(2); // Move to Authorization/Loading Step

        // Mock Login/API call simulation
        setTimeout(() => {
            if (loginId && password && password.length > 5) { // Simple validation
                setStep(3);
                setTimeout(() => {
                    onComplete(platformId, true); // Complete integration
                }, 1000);
            } else {
                setLoading(false);
                setError("Login failed. Please check your credentials or ensure the account is active.");
                setStep(1); 
            }
        }, 2000);
    };

    // --- WhatsApp Handlers ---
    const handleSendOTP = () => {
        // OTP Logic (simplified for this component)
        const phoneRegex = /^\+\d{8,15}$/;
        if (!phoneRegex.test(mobileNumber)) {
            setError('Invalid mobile number format. Please include country code, e.g., +1234567890.');
            return;
        }
        setError(null);
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            const mockOtp = String(Math.floor(100000 + Math.random() * 900000));
            setOtpSent(mockOtp);
            console.log(`Mock OTP for ${platform.name}: ${mockOtp}`); // Log mock OTP for testing
            setError(`Mock OTP Sent (use ${mockOtp}) to verify connection.`); // Use error message box to display mock OTP
        }, 1500);
    };

    const handleVerifyOTP = () => {
        setLoading(true);
        setError(null);
        setTimeout(() => {
            setLoading(false);
            if (otpInput === otpSent) {
                setStep(3);
                onComplete(platformId, true);
            } else {
                setError("Incorrect OTP. Please try again.");
            }
        }, 1500);
    };
    // --- End WhatsApp Handlers ---


    const PermissionsList = () => (
        <ul className="space-y-3 mt-4 text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
                <CheckCircle size={18} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Read Posts & Engagement</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Required to pull analytics data, comments, and likes for the dashboard reports.</p>
                </div>
            </li>
            <li className="flex items-start">
                <CheckCircle size={18} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Publish Content</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Required to publish scheduled posts, including images and videos, directly to your profile/page.</p>
                </div>
            </li>
            <li className="flex items-start">
                <CheckCircle size={18} className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Access Profile/Page Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Required to identify and list the specific pages or accounts you wish to manage in ConnectIQ.</p>
                </div>
            </li>
        </ul>
    );

    const RenderStepContent = () => {
        switch (step) {
            case 1:
            case 2: // Permissions and Authorization
                return (
                    <>
                        <div className="lg:col-span-2">
                            <h2 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-gray-100">
                                {step === 1 ? `Connect to ${platform.name}` : `Authorizing...`}
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                                {step === 1 
                                    ? `Please securely authorize ConnectIQ by providing your credentials and granting permissions below.`
                                    : `Please wait while we securely establish the connection with ${platform.name}. This may take a moment.`
                                }
                            </p>
                            
                            {step === 1 && (
                                <>
                                    {/* Authorization Fields based on platform type */}
                                    <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-blue-600 dark:text-blue-400">Credentials</h3>
                                    <AuthFields 
                                        // KEY FIX applied here to preserve AuthFields identity across re-renders
                                        key={platformId} 
                                        platformId={platformId}
                                        loading={loading}
                                        mobileNumber={mobileNumber}
                                        setMobileNumber={setMobileNumber}
                                        otpInput={otpInput}
                                        setOtpInput={setOtpInput}
                                        handleSendOTP={handleSendOTP}
                                        handleVerifyOTP={handleVerifyOTP}
                                        handleLogin={handleLogin}
                                    />
                                    
                                    <h3 className="text-xl font-semibold border-b pb-2 mt-8 mb-4 text-blue-600 dark:text-blue-400">Required Permissions</h3>
                                    <PermissionsList />
                                </>
                            )}
                            {step === 2 && (
                                <div className="text-center py-10">
                                    <Clock size={48} className="mx-auto text-blue-500 dark:text-blue-400 animate-spin" />
                                    <p className="mt-4 text-lg font-medium">Processing authorization token...</p>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-inner">
                            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">Quick Guide</h3>
                            <ol className="space-y-3 text-gray-700 dark:text-gray-300">
                                <li>1. Enter your credentials above.</li>
                                <li>2. Click the **Secure Login** button.</li>
                                <li>3. A window (or OTP field) will confirm access.</li>
                                <li>4. If asked, select the accounts/pages to manage.</li>
                                <li>5. Authorize the connection.</li>
                            </ol>
                            {error && (
                                <div className="mt-6 p-3 text-sm font-medium text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg border border-red-300 flex items-center">
                                    <AlertTriangle size={18} className="mr-2" /> 
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                        </div>
                    </>
                );
            case 3: // Success
                return (
                    <div className="lg:col-span-3 text-center py-20 bg-green-50 dark:bg-green-900/50 rounded-xl">
                        <CheckCircle size={64} className="mx-auto text-green-600" />
                        <h2 className="text-3xl font-extrabold mt-4 text-green-700 dark:text-green-300">
                            Success! {platform.name} is now connected.
                        </h2>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                            You can now schedule posts and view analytics from your dashboard.
                        </p>
                        <button
                            onClick={() => onComplete(platformId, true)}
                            className="mt-6 py-3 px-8 rounded-lg text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            Return to Integrations
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header / Progress Bar */}
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-md">
                <button 
                    onClick={() => onBack(platformId)}
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors px-3 py-1 rounded-lg"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Integrations
                </button>
                
                {/* FIX: Centered Title Container */}
                {/* Ensure the centered element doesn't overlap the buttons on narrow screens */}
                <div className="absolute left-1/2 transform -translate-x-1/2 hidden sm:flex items-center"> 
                    <div className={`p-2 rounded-full ${platform.color} mr-3`}>
                        <Icon size={24} className="text-white" />
                    </div>
                    <h1 className={`text-2xl font-bold text-gray-900 dark:text-gray-100`}>
                        {platform.name} Integration
                    </h1>
                </div>
                
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Step {progress} of {steps.length}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-10">
                <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 min-h-[calc(100vh-140px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <RenderStepContent />
                    </div>
                </div>
            </main>
        </div>
    );
};


// --- Integrations Management Page ---

const IntegrationsPageContent = ({ setFullIntegration, platformConnections, setPlatformConnections }) => { // Pass platformConnections and setter
    // NOTE: connections state replaced by platformConnections prop to ensure synchronization
    
    const [message, setMessage] = useState(''); // Unified message state for this page

    // Effect to handle status messages from the full integration flow completion
    // Since the full integration flow now updates platformConnections directly, we monitor that.
    useEffect(() => {
        // Simple hack: Check if any connection status changed to true recently (requires external timestamp/flag in real app)
        const lastConnected = Object.keys(platformConnections).find(id => platformConnections[id] === true);
        if (lastConnected) {
            const platformName = PLATFORMS.find(p => p.id === lastConnected).name;
            setMessage({ type: 'success', text: `${platformName} successfully connected!` });
            // Optionally clear the message after a delay
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [platformConnections]);

    const handleLogin = (id) => {
        const platform = PLATFORMS.find(p => p.id === id);
        
        if (platformConnections[id]) {
             // Disconnect logic
             console.log(`Attempting to disconnect ${platform.name}.`); 
             setPlatformConnections(prev => ({ ...prev, [id]: false }));
             setMessage({ type: 'success', text: `${platform.name} disconnected.` });
        } else {
            // Initiate full-screen connection flow
            setMessage('');
            setFullIntegration(id);
        }
    };


    return (
        <div className="p-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 min-h-[500px]">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">
                    Manage Integrations
                </h1>
                
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4 border-b pb-2">
                    Connect Accounts
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Connect your social media and cloud accounts to enable scheduling and analytics.
                </p>

                {/* Message Display */}
                {message && (
                    <div className={`mb-4 p-3 flex items-center rounded-lg font-medium border ${
                        message.type === 'success' 
                            ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700' 
                            : message.type === 'error'
                                ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700'
                                : 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700'
                    }`}>
                        {message.type === 'success' ? <CheckCircle size={18} className="mr-2" /> : <AlertTriangle size={18} className="mr-2" />}
                        {message.text}
                    </div>
                )}


                {/* Integration Blocks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PLATFORMS.map(platform => {
                        const Icon = platform.icon;
                        // READ from platformConnections state
                        const isConnected = platformConnections[platform.id];
                        
                        const buttonLabel = isConnected ? 'Disconnect' : 'Connect Account';
                        
                        return (
                            <div 
                                key={platform.id} 
                                className="flex flex-col p-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md bg-gray-50 dark:bg-gray-900/50 transition-all duration-200 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-full ${platform.color} mr-3`}>
                                            <Icon size={20} className="text-white" />
                                        </div>
                                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{platform.name}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                        isConnected 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                        }`}>
                                        {isConnected ? 'Connected' : 'Disconnected'}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 h-10">
                                    {platform.description}
                                </p>
                                
                                {/* Standard Connect/Disconnect Button */}
                                <button
                                    onClick={() => handleLogin(platform.id)}
                                    className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                                        isConnected
                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                >
                                    {buttonLabel}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


const SettingsContent = () => (
    <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 min-h-[500px]">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Application Settings</h1>
            
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4 border-b pb-2">User Experience</h3>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <label htmlFor="scroll-speed" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Navigation Scroll Speed (Smoothness)
                </label>
                <select id="scroll-speed" disabled className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-48">
                    <option>Fast (Default)</option>
                    <option>Medium</option>
                    <option>Slow</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Currently mocked using browser's 'smooth' behavior. Custom durations would be implemented here.
                </p>
            </div>

            {/* Other settings placeholders */}
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mt-8 mb-4 border-b pb-2">Account Management</h3>
            <p className="text-gray-600 dark:text-gray-300">Manage API keys and connected accounts here.</p>
        </div>
    </div>
);


const AnalyticsContent = () => (
    <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 min-h-[500px]">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Analytics & Reporting</h1>
            <div className="flex flex-col space-y-4">
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    View performance charts and engagement metrics across all connected platforms here.
                </p>
                <div className="p-4 border border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/50">
                    <h3 className="font-semibold text-blue-700 dark:text-blue-300">Feature Placeholder</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detailed charts, post trend lines, and audience demographic reports will be displayed in this area.
                    </p>
                </div>
            </div>
        </div>
    </div>
);


// --- Main Application Component ---
const App = () => {
  const { db, userId, isAuthReady } = useFirebase();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // Default view is 'dashboard' - but now conditional on onboarding state
  const [view, setView] = useState('dashboard'); 
  const [isTargetingIntegrations, setIsTargetingIntegrations] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- NEW ONBOARDING STATE ---
  const [interestsCompleted, setInterestsCompleted] = useState(null); // null, true, or false

  const [platformConnections, setPlatformConnections] = useState({
      'facebook': false, 
      'instagram': false, 
      'twitter': false, 
      'linkedin': false, 
      'whatsapp': false, 
      'onedrive': false
  });


  // New state for full-screen integration view
  const [fullIntegration, setFullIntegration] = useState(null); // 'facebook' | 'twitter' | null

  // New state for Trending Content Modal
  const [isTrendingModalOpen, setIsTrendingModalOpen] = useState(false);
  const [modalPlatformId, setModalPlatformId] = useState(null);

  // Refs for scrolling
  const mainContentRef = useRef(null);
  const integrationsRef = useRef(null);

  // Toggle function for sidebar
  const toggleSidebar = () => {
      setIsSidebarOpen(prev => !prev);
  };

  // Callback to handle completion from the full-screen view (Authorization successful)
  const handleIntegrationComplete = useCallback((platformId, status) => {
      // REQUIRED: Update centralized state upon success
      setPlatformConnections(prev => ({
          ...prev,
          [platformId]: status // status is true on successful completion
      }));
      setFullIntegration(null);
      setView('integrations_page');
  }, []);
  
  // Callback to handle back click from the full-screen view
  const handleIntegrationBack = useCallback((platformId) => {
      setFullIntegration(null);
      setView('integrations_page');
  }, []);
  
  // Trending Content Handlers
  const openTrendingModal = useCallback((platformId) => {
      setModalPlatformId(platformId);
      setIsTrendingModalOpen(true);
  }, []);

  const closeTrendingModal = useCallback(() => {
      setIsTrendingModalOpen(false);
      setModalPlatformId(null);
  }, []);
  
  // Handler for Trending Auth Modal completion (updates centralized state)
  const handleTrendingConnect = useCallback((platformId, status) => {
      setPlatformConnections(prev => ({
          ...prev,
          [platformId]: status // status is true on successful connection
      }));
  }, []);


  // Scroll and Navigation handler
  const handleNavClick = useCallback((path) => {
    // 1. Handle special cases (Modals/Scroll)
    if (path === 'composer') {
      setIsComposerOpen(true);
      
    } else {
      // 2. Handle all navigation clicks
      setView(path);

      if (path === 'dashboard' && mainContentRef.current) {
        // Scroll to top when navigating to dashboard view
        mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, []);


  // 1. Load Theme and Onboarding Preferences from Firestore
  useEffect(() => {
    if (db && userId) {
      const themeRef = doc(db, `artifacts/${appId}/users/${userId}/preferences/theme`);
      const onboardingRef = doc(db, `artifacts/${appId}/users/${userId}/preferences/onboarding`);

      // Theme Listener
      const unsubscribeTheme = onSnapshot(themeRef, (docSnap) => {
        if (docSnap.exists() && typeof docSnap.data().isDarkMode === 'boolean') {
          setIsDarkMode(docSnap.data().isDarkMode);
        } else {
          // Default to system preference if no data in Firestore
          const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDarkMode(prefersDark);
        }
      }, (error) => {
        console.error("Error listening to theme preference:", error);
      });

      // Onboarding Listener
      const unsubscribeOnboarding = onSnapshot(onboardingRef, (docSnap) => {
          // If document exists and flag is set to true, skip interests
        if (docSnap.exists() && docSnap.data().interestsCompleted === true) {
          setInterestsCompleted(true);
        } else {
            // Otherwise, require interest selection
          setInterestsCompleted(false);
        }
      }, (error) => {
        console.error("Error listening to onboarding preference:", error);
        // Fallback to requiring selection if Firestore fails
        setInterestsCompleted(false);
      });


      return () => {
          unsubscribeTheme();
          unsubscribeOnboarding();
      };
    }
  }, [db, userId]);


  // 2. Load Scheduled Posts from Firestore
  useEffect(() => {
    if (db && userId && interestsCompleted) { // Only fetch dashboard data if onboarding is complete
      const postsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/scheduled_posts`);
      // Sort by scheduledTime for display
      const q = query(postsCollectionRef, orderBy('scheduledTime', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure timestamp is converted for rendering if it exists
          scheduledTime: doc.data().scheduledTime || { seconds: Date.now() / 1000 }
        }));
        setScheduledPosts(posts);
      }, (error) => {
        console.error("Error listening to scheduled posts:", error);
      });

      return () => unsubscribe();
    }
  }, [db, userId, interestsCompleted]); // Dependency added

  // 3. Theme Toggle Function (updates state and Firestore)
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (db && userId) {
        saveThemePreference(db, userId, newMode);
      }
      return newMode;
    });
  }, [db, userId]);

  // Apply dark/light class to body/main container
  const containerClasses = `flex h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`;

  // Helper function to render content based on view state
  const renderContent = () => {
    // Priority 1: Loading/Auth State
    if (!isAuthReady || interestsCompleted === null) {
        return (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-xl font-semibold animate-pulse text-blue-600 dark:text-blue-400">
              Initializing ConnectIQ...
            </div>
          </div>
        );
    }

    // Priority 2: Interest Onboarding
    if (interestsCompleted === false) {
        return <InterestSelectionView onComplete={setInterestsCompleted} db={db} userId={userId} isDarkMode={isDarkMode} />;
    }

    // Priority 3: Full Screen Integration
    if (fullIntegration) {
        return <FullIntegrationView 
                    platformId={fullIntegration} 
                    onBack={handleIntegrationBack}
                    onComplete={handleIntegrationComplete}
               />;
    }

    // Priority 4: Main Application Views
    switch (view) {
      case 'dashboard':
        return <DashboardContent 
                    scheduledPosts={scheduledPosts}
                    integrationsRef={integrationsRef}
                    isTargetingIntegrations={isTargetingIntegrations}
                    openTrendingModal={openTrendingModal} 
                    platformConnections={platformConnections} // Pass connection state
               />;
      case 'analytics':
        return <AnalyticsContent />;
      case 'integrations_page': 
        return <IntegrationsPageContent 
                     setFullIntegration={setFullIntegration}
                     platformConnections={platformConnections} // Pass connection state
                     setPlatformConnections={setPlatformConnections} // Pass setter for disconnect
               />;
      case 'trending_panel': 
          return <TrendingSidebarContent openTrendingModal={openTrendingModal} />;
      case 'settings':
        return <SettingsContent />;
      default:
        // Defaulting to DashboardContent
        return <DashboardContent 
                    scheduledPosts={scheduledPosts}
                    integrationsRef={integrationsRef}
                    isTargetingIntegrations={isTargetingIntegrations}
                    openTrendingModal={openTrendingModal} 
                    platformConnections={platformConnections} 
               />;
    }
  };

  return (
    <div className={containerClasses}>
        {/* Render Sidebar and TopBar ONLY if interests are completed */}
        {interestsCompleted === true && (
            <>
                <Sidebar 
                    isDarkMode={isDarkMode} 
                    handleNavClick={handleNavClick} 
                    isSidebarOpen={isSidebarOpen} 
                    toggleSidebar={toggleSidebar} 
                    view={view} 
                />
                <main ref={mainContentRef} className="flex-1 flex flex-col overflow-y-auto">
                    <TopBar
                        toggleTheme={toggleTheme}
                        isDarkMode={isDarkMode}
                        userId={userId}
                        openComposer={() => handleNavClick('composer')}
                        openLoginModal={() => setIsLoginModalOpen(true)}
                    />
                    {renderContent()} 
                </main>
            </>
        )}
        {/* Render Interest Selection View when onboarding is needed */}
        {interestsCompleted === false && (
            <div className="flex flex-1 flex-col overflow-y-auto">
                <InterestSelectionView 
                    onComplete={setInterestsCompleted} 
                    db={db} 
                    userId={userId} 
                    isDarkMode={isDarkMode} 
                />
            </div>
        )}
        {/* Render Loading/Initial state */}
        {interestsCompleted === null && renderContent()}

      <ComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        db={db}
        userId={userId}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <TrendingAuthModal
        isOpen={isTrendingModalOpen}
        onClose={closeTrendingModal}
        platformId={modalPlatformId}
        onConnect={handleTrendingConnect}
      />
    </div>
  );
};

export default App;
