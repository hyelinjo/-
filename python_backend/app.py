import os
from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, and_
from datetime import datetime
import pandas as pd
import io

app = Flask(__name__)
app.secret_key = 'kyobo_key_secret'

# DB 설정
basedir = os.path.abspath(os.path.dirname(__file__))
print(f"DEBUG: basedir resolved to: {basedir}") # New debug print
db_path = os.path.join(basedir, 'schedule.db')
print(f"DEBUG: Constructed db_path: {db_path}") # New debug print
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + db_path.replace('\\', '/') # Ensure forward slashes for URI
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
print(f"DEBUG: Final SQLALCHEMY_DATABASE_URI: {SQLALCHEMY_DATABASE_URI}") # New debug print
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True # Enable SQL query logging

db = SQLAlchemy(app)
print(f"DEBUG: Using database at: {db_path}") # This print is now slightly redundant, but can stay.


# --- 모델 정의 ---
class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    applicant = db.Column(db.String(50))
    contact = db.Column(db.String(20))
    pwd = db.Column(db.String(4))
    region = db.Column(db.String(20))
    center = db.Column(db.String(50))
    topic = db.Column(db.String(100))
    start = db.Column(db.DateTime)
    end = db.Column(db.DateTime)

# [수정] region 컬럼 추가
class Holiday(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(50))
    start = db.Column(db.DateTime)
    color = db.Column(db.String(20), default='#d32f2f')
    region = db.Column(db.String(20), default='all') # 'all'이면 전체, 아니면 권역코드

class Topic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    region = db.Column(db.String(20))
    title = db.Column(db.String(100))
    order_index = db.Column(db.Integer, default=0)

# --- 초기 데이터 세팅 ---
def init_db_data():
    if Topic.query.count() == 0:
        defaults = ["기본 교육(WiFi 설정 등)", "청약 과정(고객 등록)", "교보톡톡 활용"]
        regions = ['gangbuk', 'gangnam', 'gyeongin', 'busan', 'jungbu', 'daegu', 'honam']
        for r in regions:
            for idx, t in enumerate(defaults):
                db.session.add(Topic(region=r, title=t, order_index=idx))
        db.session.commit()

# --- 라우트 ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    if not session.get('is_admin'):
        return render_template('login.html')
    return render_template('admin.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if data.get('password') == 'kyobo11!':
        session['is_admin'] = True
        return jsonify({'status': 'success'})
    return jsonify({'status': 'fail', 'message': '비밀번호가 틀렸습니다.'})

@app.route('/api/logout')
def logout():
    session.pop('is_admin', None)
    return redirect('/')

# --- 일정 API ---
@app.route('/api/events')
def get_events():
    selected_region = request.args.get('region')
    
    # 스케줄 필터링
    if selected_region:
        schedules = Schedule.query.filter_by(region=selected_region).all()
    else:
        schedules = Schedule.query.all()


        print(schedules)
        
    events = []
    for s in schedules:
        title_text = f"[{s.topic}] {s.center} ({s.applicant})" if s.topic else f"{s.center} ({s.applicant})"
        events.append({
            'id': s.id,
            'title': title_text,
            'start': s.start.isoformat(),
            'end': s.end.isoformat(),
            'color': '#3788d8',
            'extendedProps': {
                'type': 'schedule', 'pwd': s.pwd, 'region': s.region, 'topic': s.topic,
                'center': s.center, 'applicant': s.applicant, 'contact': s.contact 
            },
            'region': s.region 
        })
    
    # 휴일 데이터 처리 (selected_region이 'all'이 아니면 해당 지역 + 'all' 휴일 포함)
    if selected_region:
        holidays = Holiday.query.filter(
            (Holiday.region == selected_region) | (Holiday.region == 'all')
        ).all()
    else:
        holidays = Holiday.query.all()

    for h in holidays:
        prefix = "[전체]" if h.region == 'all' else "[개별]"
        events.append({
            'id': h.id, 
            'title': f"⛔ {prefix} {h.title}",
            'start': h.start.isoformat(),
            'allDay': True,
            'color': '#d32f2f',
            'textColor': 'white',
            'editable': False,
            'extendedProps': {'type': 'holiday', 'region': h.region} # region 정보 포함
        })
    return jsonify(events)

@app.route('/api/add', methods=['POST'])
def add_event():
    data = request.json
    try:
        new_start = datetime.fromisoformat(data['start'])
        new_end = datetime.fromisoformat(data['end'])
        new_date_str = new_start.strftime('%Y-%m-%d')
        target_region = data['region'] 
        
        is_new_am = new_start.hour < 12

        existing_schedules = Schedule.query.filter(
            func.strftime('%Y-%m-%d', Schedule.start) == new_date_str,
            Schedule.region == target_region
        ).all()

        has_other_schedule = False

        for schedule in existing_schedules:
            is_exist_am = schedule.start.hour < 12
            if is_new_am == is_exist_am:
                period = "오전" if is_new_am else "오후"
                return jsonify({'status': 'fail', 'message': f"[{target_region}] {new_date_str} {period}에는 이미 확정된 일정이 있습니다."})
            has_other_schedule = True

        new_sch = Schedule(
            applicant=data['applicant'],
            contact=data.get('contact', ''),
            pwd=data['pwd'],
            region=data['region'],
            center=data['center'],
            topic=data.get('topic', '기본 교육'),
            start=new_start,
            end=new_end
        )
        db.session.add(new_sch)
        db.session.commit()

        if has_other_schedule:
            return jsonify({'status': 'warning', 'message': f"[{target_region}] 해당 일자에 이미 다른 시간대(오전/오후) 일정이 있습니다.\n이동 시간을 고려하여 진행 가능한지 확인 바랍니다."})

        return jsonify({'status': 'success'})
    except Exception as e:
        db.session.rollback()
        print(f"ERROR: Exception during add_event: {e}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/edit', methods=['POST'])
def edit_event():
    data = request.json
    sch = Schedule.query.get(data['id'])
    if not sch:
        return jsonify({'status': 'fail', 'message': '일정을 찾을 수 없습니다.'})

    new_start = datetime.fromisoformat(data['start'])
    new_end = datetime.fromisoformat(data['end'])
    new_date_str = new_start.strftime('%Y-%m-%d')
    
    is_new_am = new_start.hour < 12
    existing_schedules = Schedule.query.filter(
        func.strftime('%Y-%m-%d', Schedule.start) == new_date_str,
        Schedule.region == sch.region,
        Schedule.id != sch.id 
    ).all()

    for schedule in existing_schedules:
        is_exist_am = schedule.start.hour < 12
        if is_new_am == is_exist_am:
             return jsonify({'status': 'fail', 'message': "수정하려는 시간에 이미 다른 일정이 있습니다."})

    sch.center = data['center']
    sch.topic = data['topic']
    sch.applicant = data['applicant']
    sch.contact = data['contact']
    sch.start = new_start
    sch.end = new_end
    
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/api/topics', methods=['GET'])
def get_topics():
    region = request.args.get('region')
    if region:
        topics = Topic.query.filter_by(region=region).order_by(Topic.order_index).all()
    else:
        topics = Topic.query.order_by(Topic.order_index).all()
    return jsonify([{'id': t.id, 'title': t.title, 'region': t.region} for t in topics])

@app.route('/api/topic/add', methods=['POST'])
def add_topic():
    data = request.json
    max_order = db.session.query(func.max(Topic.order_index)).filter_by(region=data['region']).scalar()
    new_order = (max_order if max_order is not None else -1) + 1
    new_t = Topic(region=data['region'], title=data['title'], order_index=new_order)
    db.session.add(new_t)
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/api/topic/delete', methods=['POST'])
def delete_topic():
    data = request.json
    t = Topic.query.get(data['id'])
    if t:
        db.session.delete(t)
        db.session.commit()
        return jsonify({'status': 'success'})
    return jsonify({'status': 'fail'})

@app.route('/api/topic/reorder', methods=['POST'])
def reorder_topic():
    data = request.json
    for idx, topic_id in enumerate(data['ids']):
        t = Topic.query.get(topic_id)
        if t: t.order_index = idx
    db.session.commit()
    return jsonify({'status': 'success'})

# [수정] 휴일 추가 시 region 처리
@app.route('/api/add_holiday', methods=['POST'])
def add_holiday():
    data = request.json
    new_start = datetime.fromisoformat(data['start'])
    # region 기본값은 'all'
    region_val = data.get('region', 'all')
    
    new_holiday = Holiday(title=data['title'], start=new_start, region=region_val)
    db.session.add(new_holiday)
    db.session.commit()
    return jsonify({'status': 'success'})

@app.route('/api/delete', methods=['POST'])
def delete_event():
    data = request.json
    if data.get('type') == 'holiday':
        h = Holiday.query.get(data['id'])
        if h:
            db.session.delete(h)
            db.session.commit()
            return jsonify({'status': 'success'})
        return jsonify({'status': 'fail'})

    sch = Schedule.query.get(data['id'])
    if sch and (str(sch.pwd) == str(data['pwd']) or str(data['pwd']) == 'admin1234'):
        db.session.delete(sch)
        db.session.commit()
        return jsonify({'status': 'success'})
    return jsonify({'status': 'fail', 'message': '비밀번호 불일치'})

@app.route('/download_excel')
def download_excel():
    schedules = Schedule.query.all()
    holidays = Holiday.query.all()
    data_list = []
    
    for s in schedules:
        date_str = s.start.strftime('%Y-%m-%d')
        time_str = f"{s.start.strftime('%H:%M')}~{s.end.strftime('%H:%M')}"
        info = f"[{s.topic}] {s.center}({time_str})"
        data_list.append({'Date': date_str, 'Region': s.region, 'Info': info})

    for h in holidays:
        date_str = h.start.strftime('%Y-%m-%d')
        # [수정] 엑셀에도 구분 표시
        region_str = "공통휴일" if h.region == 'all' else f"{h.region}휴일"
        data_list.append({'Date': date_str, 'Region': region_str, 'Info': h.title})

    df = pd.DataFrame(data_list)
    output = io.BytesIO()
    
    if not df.empty:
        df_pivot = df.pivot_table(index='Date', columns='Region', values='Info', aggfunc=lambda x: ', '.join(x)).reset_index()
        df_pivot['Date'] = pd.to_datetime(df_pivot['Date'])
        df_pivot = df_pivot.sort_values('Date')
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df_pivot.to_excel(writer, index=False, sheet_name='교육일정')
            worksheet = writer.sheets['교육일정']
            for i, col in enumerate(df_pivot.columns):
                column_len = max(df_pivot[col].astype(str).map(len).max(), len(col)) + 5
                worksheet.set_column(i, i, column_len)
    else:
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            pd.DataFrame(columns=['Date', 'Region']).to_excel(writer, index=False)

    output.seek(0)
    return send_file(output, download_name="education_schedule.xlsx", as_attachment=True)

@app.route('/api/regions', methods=['GET'])
def get_regions():
    regions = db.session.query(Topic.region).distinct().all()
    region_list = sorted([r[0] for r in regions if r[0] is not None])
    return jsonify(region_list)

if __name__ == '__main__':
    with app.app_context():
        # Force delete and recreate DB to ensure we are using the correct one
        if os.path.exists(db_path):
            os.remove(db_path)
            print(f"DEBUG: Deleted old database file at: {db_path}")
        
        print("DEBUG: Creating new database tables...")
        db.create_all()
        init_db_data()
        print("DEBUG: Database created and initialized.")
    app.run(host='0.0.0.0', port=5000, debug=True)