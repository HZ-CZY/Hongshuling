/**
 * 趣味知识问答：逐题作答、即时反馈；全部答对则解锁下一物种并发放徽章。
 */
(function (global) {
  'use strict';
  const { el, toast, escapeHtml } = global.U;

  class QuizPanel {
    constructor(sp, onComplete) {
      this.sp = sp;
      this.onComplete = onComplete;
      this.idx = 0;
      this.correctCount = 0;
      this.answered = [];
    }

    render() {
      const q = this.sp.quizzes[this.idx];
      const total = this.sp.quizzes.length;
      const wrap = el('div', { class: 'quiz-view' });

      wrap.appendChild(el('div', { class: 'quiz-progress' }, [
        el('span', { text: `${this.sp.emoji} ${this.sp.name} · 第 ${this.idx + 1}/${total} 题` }),
      ]));

      wrap.appendChild(el('h3', { class: 'quiz-q', text: q.q }));

      const opts = el('div', { class: 'quiz-opts' });
      q.options.forEach((opt, i) => {
        opts.appendChild(el('button', {
          class: 'quiz-opt', text: opt,
          onclick: () => this._answer(i, opts, q),
        }));
      });
      wrap.appendChild(opts);

      this._feedback = el('div', { class: 'quiz-feedback' });
      wrap.appendChild(this._feedback);

      this._next = el('button', {
        class: 'ic-btn quiz-next', text: '下一题 →', style: { display: 'none' },
        onclick: () => this._nextQuestion(wrap),
      });
      wrap.appendChild(this._next);

      return wrap;
    }

    _answer(i, optsBox, q) {
      if (this.answered[this.idx] != null) return;
      this.answered[this.idx] = i;
      const correct = i === q.answer;
      if (correct) this.correctCount++;

      [...optsBox.children].forEach((b, bi) => {
        b.disabled = true;
        if (bi === q.answer) b.classList.add('correct');
        else if (bi === i) b.classList.add('wrong');
      });

      this._feedback.className = 'quiz-feedback ' + (correct ? 'ok' : 'no');
      this._feedback.innerHTML = (correct ? '✅ 答对了！ ' : '❌ 答错了。 ') +
        escapeHtml(q.explain);

      const isLast = this.idx >= this.sp.quizzes.length - 1;
      this._next.textContent = isLast ? '查看成绩 🎉' : '下一题 →';
      this._next.style.display = 'inline-block';
    }

    _nextQuestion(wrap) {
      const isLast = this.idx >= this.sp.quizzes.length - 1;
      if (isLast) {
        if (this._completed) return;
        this._completed = true;
        const allCorrect = this.correctCount === this.sp.quizzes.length;
        this.onComplete && this.onComplete(this.sp, allCorrect, this.correctCount, this.sp.quizzes.length);
        return;
      }
      this.idx++;
      const fresh = this.render();
      wrap.replaceWith(fresh);
    }
  }

  global.QuizPanel = QuizPanel;
})(window);
