import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { auth, db } from "../../firebaseConfig";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Background from "../../components/Background";
import Logo from "../../components/Logo";
import Header from "../../components/Header";
import { theme } from "../../core/theme";

const DocFeedback = ({ navigation }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingsCount, setRatingsCount] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  });
  const [totalReviews, setTotalReviews] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchFeedback = async () => {
      try {
        const feedbackRef = collection(db, "feedback");
        const q = query(
          feedbackRef, 
          where("docId", "==", user.uid),
          orderBy("date", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const feedbackData = [];
        let totalRating = 0;
        const ratingsCounts = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        };
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          feedbackData.push({
            id: doc.id,
            ...data
          });
          
          totalRating += data.rating;
          ratingsCounts[data.rating] = (ratingsCounts[data.rating] || 0) + 1;
        });
        
        setFeedbacks(feedbackData);
        setTotalReviews(feedbackData.length);
        setAverageRating(feedbackData.length > 0 ? (totalRating / feedbackData.length).toFixed(1) : 0);
        setRatingsCount(ratingsCounts);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [user]);

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text 
            key={star}
            style={[
              styles.star,
              { color: star <= rating ? theme.colors.primary : '#e4e5e9' }
            ]}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  const renderRatingBar = (rating, percentage) => {
    return (
      <View style={styles.ratingBarContainer}>
        <Text style={styles.ratingNumber}>{rating}</Text>
        <View style={styles.ratingBarWrapper}>
          <View style={[styles.ratingBar, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingPercentage}>{percentage}%</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Background>
          <Logo />
          <Header>DocFeedback</Header>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </Background>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <Header style={styles.header}>View Feedback</Header>
        
        <View style={styles.summaryContainer}>
          <View style={styles.averageRatingContainer}>
            <Text style={styles.averageRating}>{averageRating}</Text>
            {renderStars(Math.round(averageRating))}
            <Text style={styles.reviewsCount}>{totalReviews} reviews</Text>
          </View>
          
          <View style={styles.ratingBreakdown}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingsCount[rating] || 0;
              const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              
              return (
                <View key={rating}>
                  {renderRatingBar(rating, percentage)}
                </View>
              );
            })}
          </View>
        </View>
        
        <ScrollView style={styles.feedbackContainer}>
          {feedbacks.length === 0 ? (
            <Text style={styles.noDataText}>No feedback received yet.</Text>
          ) : (
            feedbacks.map((feedback) => (
              <View key={feedback.id} style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <View style={styles.starRating}>
                    {renderStars(feedback.rating)}
                  </View>
                  <Text style={styles.dateText}>{feedback.date}</Text>
                </View>
                {feedback.notes ? (
                  <Text style={styles.notesText}>{feedback.notes}</Text>
                ) : (
                  <Text style={styles.emptyNotesText}>No additional notes</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 27,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginTop: 15, // <-- added for spacing from header
    marginHorizontal: 0, // <-- reduced to make the card wider
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  averageRatingContainer: {
    alignItems: 'center',
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    paddingRight: 10,
    paddingTop: 30,
  },
  averageRating: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  star: {
    fontSize: 18,
    marginHorizontal: 1,
  },
  reviewsCount: {
    color: '#6b7280',
    marginTop: 5,
  },
  ratingBreakdown: {
    flex: 1.5,
    paddingLeft: 15,
    justifyContent: 'center',
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
    paddingTop: 10,
    width: '100%',
  },
  ratingNumber: {
    width: 15,
    fontSize: 12,
    color: '#6b7280',
  },
  ratingBarWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: '#e4e5e9',
    borderRadius: 4,
    marginHorizontal: 5,
  },
  ratingBar: {
    height: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  ratingPercentage: {
    width: 30,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  feedbackContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 15,
    paddingTop:10,
  },
  feedbackCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  starRating: {
    flexDirection: 'row',
  },
  dateText: {
    color: '#6b7280',
    fontSize: 14,
  },
  notesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  emptyNotesText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  noDataText: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default DocFeedback;