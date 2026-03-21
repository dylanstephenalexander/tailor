const CUTSCENES = {
    low_fiber: {
      emoji: '🥦',
      title: "You're a little low on fiber",
      message: "Redeem this coupon for some sourdough with your local taxman.",
    },
    holy_saturated_fat: {
      emoji: '🥩',
      title: "Holy saturated fat!!",
      message: "Someone's been hitting the beef a little hard today.",
    },
    omg_cholesterol: {
      emoji: '😱',
      title: "Omg your cholesterol",
      message: "That's a lot of eggs babe.",
    },
    happy_birthday: {
      emoji: '🎂',
      title: "Happy birthday love",
      message: "Hope today is as wonderful as you are.",
    },
    happy_anniversary: {
      emoji: '🎉',
      title: "Happy anniversary",
      message: "So grateful for every day with you.",
    },
    pr_earned: {
      emoji: '🏆',
      title: "New PR!",
      message: "Look at you go. Absolutely crushing it.",
    },
    earned_coffee_crisp: {
      emoji: '☕',
      title: "You've earned a coffee crisp",
      message: "Effort score off the charts. You deserve it.",
    },
  }
  
  export default function CutsceneModal({ cutscene, onDismiss }) {
    const data = CUTSCENES[cutscene] || { emoji: '✨', title: 'Nice work', message: 'Keep it up.' }
  
    return (
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(58, 50, 56, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 24,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#FFF0F3',
            borderRadius: 24,
            padding: '36px 28px 28px',
            textAlign: 'center',
            maxWidth: 320,
            width: '100%',
            fontFamily: "'DM Sans', sans-serif",
            border: '0.5px solid #E8B4BC',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>{data.emoji}</div>
          <div style={{
            fontFamily: "'Lora', serif",
            fontSize: 22,
            color: '#3A3238',
            marginBottom: 8,
            fontStyle: 'italic',
          }}>{data.title}</div>
          <div style={{ fontSize: 13, color: '#6E4555', lineHeight: 1.6 }}>{data.message}</div>
          <button
            onClick={onDismiss}
            style={{
              marginTop: 24,
              background: '#D282A6',
              color: '#FFF0F3',
              border: 'none',
              borderRadius: 14,
              padding: '12px 32px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            ok ok I get it
          </button>
        </div>
      </div>
    )
  }