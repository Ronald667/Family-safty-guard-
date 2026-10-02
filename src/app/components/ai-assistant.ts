import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ai-assistant',
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-6 pb-12 flex flex-col h-[calc(100vh-8rem)]">
      <!-- Header -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl shrink-0">
        <div class="flex items-center space-x-2 text-indigo-400 font-semibold text-sm mb-1">
          <mat-icon class="text-indigo-400">smart_toy</mat-icon>
          <span>CONFIDENTIAL AI SAFETY ADVISOR</span>
        </div>
        <h1 class="text-2xl md:text-3xl font-extrabold text-white">SafeHaven AI Guidance & Safety Planning</h1>
        <p class="text-slate-400 text-sm mt-1">Get trauma-informed guidance, safety planning advice, and information on legal rights in a secure, confidential environment.</p>
      </div>

      <!-- Chat Container -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-xl">
        <!-- Messages Area -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          @if (messages().length === 0) {
            <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div class="w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mb-4">
                <mat-icon class="text-3xl">support_agent</mat-icon>
              </div>
              <h3 class="font-bold text-slate-300 text-lg mb-1">How can I help you today?</h3>
              <p class="text-xs text-slate-400 max-w-md mb-6">Ask questions regarding safety planning, documenting harassment anonymously, restraining order procedures, or emotional coping strategies.</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-lg">
                @for (prompt of suggestedPrompts; track prompt) {
                  <button 
                    (click)="sendPrompt(prompt)"
                    class="p-3 text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white text-left transition">
                    {{ prompt }}
                  </button>
                }
              </div>
            </div>
          }

          @for (msg of messages(); track msg) {
            <div class="flex" [class.justify-end]="msg.role === 'user'">
              <div class="max-w-xl rounded-2xl p-4 text-sm"
                   [class.bg-indigo-600]="msg.role === 'user'"
                   [class.text-white]="msg.role === 'user'"
                   [class.bg-slate-950]="msg.role === 'model'"
                   [class.text-slate-200]="msg.role === 'model'"
                   [class.border]="msg.role === 'model'"
                   [class.border-slate-800]="msg.role === 'model'">
                @if (msg.role === 'model') {
                  <div class="flex items-center space-x-2 mb-2 text-indigo-400 font-semibold text-xs">
                    <mat-icon class="text-xs">smart_toy</mat-icon>
                    <span>SafeHaven AI Assistant</span>
                  </div>
                }
                <div class="whitespace-pre-wrap leading-relaxed">{{ msg.content }}</div>
              </div>
            </div>
          }

          @if (loading()) {
            <div class="flex justify-start">
              <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-400 text-sm flex items-center space-x-2">
                <mat-icon class="animate-spin text-indigo-400">hourglass_empty</mat-icon>
                <span>SafeHaven AI is thinking...</span>
              </div>
            </div>
          }
        </div>

        <!-- Input Bar -->
        <div class="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-3 shrink-0">
          <input 
            type="text" 
            [(ngModel)]="inputMessage"
            (keydown.enter)="sendMessage()"
            placeholder="Type your confidential safety question..."
            class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500" />
          <button 
            (click)="sendMessage()"
            [disabled]="loading() || !inputMessage.trim()"
            class="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm flex items-center space-x-1 shadow-lg shadow-indigo-600/30 transition">
            <mat-icon>send</mat-icon>
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class AiAssistant {
  http = inject(HttpClient);
  messages = signal<ChatMessage[]>([]);
  inputMessage = '';
  loading = signal<boolean>(false);

  suggestedPrompts = [
    'How do I create a safe escape plan in an emergency?',
    'What are my rights regarding restraining orders?',
    'How do I securely log evidence without my abuser knowing?',
    'What support services are available for my children?'
  ];

  sendPrompt(text: string) {
    this.inputMessage = text;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.inputMessage.trim();
    if (!text || this.loading()) return;

    const userMsg: ChatMessage = {role: 'user', content: text};
    this.messages.update(list => [...list, userMsg]);
    this.inputMessage = '';
    this.loading.set(true);

    this.http.post<{reply: string}>('/api/ai-chat', {
      message: text,
      history: this.messages()
    }).subscribe({
      next: (res) => {
        this.messages.update(list => [...list, {role: 'model', content: res.reply}]);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('AI error:', err);
        this.messages.update(list => [...list, {role: 'model', content: 'Connection error. Please call emergency services if you are in immediate danger.'}]);
        this.loading.set(false);
      }
    });
  }
}
