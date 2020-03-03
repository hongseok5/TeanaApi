CREATE DEFINER=`ssgtv`@`%` PROCEDURE `ssgtv`.`call_counsel_set`(
	in _CALL_SET_SEQ varchar(20),
	in _START_TIME varchar(20), 
	in _EXTENSION varchar(10),
	in _AGENT_ID varchar(20),
	in _CONTYPE varchar(20)
)
begin
	declare COUNTCHECK int(10);
	declare TYPEIDCOUNT int(10);
	declare TYPEIDCOUNT2 int(10);
	declare CALLNUMCHECK varchar(20);
	
	/*전체 카운터*/
	set COUNTCHECK = (select count(*) from nx_counsel_item_his where call_set_seq = _CALL_SET_SEQ);
	/*부분점수 카운터*/
	set TYPEIDCOUNT = (select count(*) from nx_counsel_item_his where item_type_cd = '01' and call_set_seq = _CALL_SET_SEQ);
	/*복수점수 카운터*/
	set TYPEIDCOUNT2 = (select count(*) from nx_counsel_item_his where item_type_cd = '02' and call_set_seq = _CALL_SET_SEQ);
	/*CALL_NUM 체크*/
	set CALLNUMCHECK = (select call_num from ua_call where start_time = _START_TIME AND extension = _EXTENSION limit 1);
	
	if COUNTCHECK > 0 then
		if TYPEIDCOUNT > 0 then
		/*평가 점수 부분 저장*/
		insert into ua_call_est_dtl (call_num, start_time, extension, counsel_type_id, counsel_item_id, emp_id 
					, dept_id, match_est_point, reg_id, reg_ip, reg_dtm, mod_id, mod_ip, mod_dtm) 
			select call_num, start_time, extension, counsel_type_id, lev3_counsel_item_id, emp_id, dept_id, item_point, 'SYSTEM', '0.0.0.0', sysdate(), 'SYSTEM', '0.0.0.0', sysdate()
			from (select CALLNUMCHECK as call_num, start_time, extension, emp_id, dept_id, lev3_counsel_item_id, counsel_type_id
						, max(lev4_item_point) as item_point 
							from nx_counsel_item_his ncih
					where item_type_cd = '01' and call_set_seq = _CALL_SET_SEQ and start_time = _START_TIME AND extension = _EXTENSION
					group by start_time, extension, emp_id, dept_id, lev3_counsel_item_id, counsel_type_id) a
					;
		end if;
		if TYPEIDCOUNT2 > 0 then
		/*평가 점수 카운터 저장*/
		insert into ua_call_est_dtl (call_num, start_time, extension, counsel_type_id, counsel_item_id, emp_id 
					, dept_id, match_est_point, reg_id, reg_ip, reg_dtm, mod_id, mod_ip, mod_dtm) 
				select call_num, start_time, extension, counsel_type_id, lev3_counsel_item_id, emp_id, dept_id, item_point, 'SYSTEM', '0.0.0.0', sysdate(), 'SYSTEM', '0.0.0.0', sysdate()
				from (select CALLNUMCHECK as call_num, start_time, extension, emp_id, dept_id, lev3_counsel_item_id, counsel_type_id
							, case when sum(lev4_item_point*item_count) > lev3_item_point then lev3_item_point else sum(lev4_item_point*item_count) end as item_point 
								from nx_counsel_item_his ncih
						where item_type_cd = '02' and call_set_seq = _CALL_SET_SEQ and start_time = _START_TIME AND extension = _EXTENSION
						group by start_time, extension, emp_id, dept_id, lev3_counsel_item_id, counsel_type_id) A
		;
		end if;	
	end if;
	/*평가 부서의 기준 정보중 API에서 넘오지 않은 값 0으로 셋팅 */
	insert into ua_call_est_dtl (call_num, start_time, extension, counsel_type_id, counsel_item_id, emp_id, dept_id, match_est_point, reg_id, reg_ip, reg_dtm, mod_id, mod_ip, mod_dtm) 
				select CALLNUMCHECK
					   , _START_TIME
					   , _EXTENSION
					   , a.counsel_type_id
					   , a.counsel_item_id
					   , (select emp_id from nx_emp where cti_id = _AGENT_ID limit 1) as emp_id
					   , (select dept_id from nx_emp where cti_id = _AGENT_ID limit 1) as dept_id
					   , 0
					   , 'SYSTEM'
					   , '0.0.0.0'
					   , sysdate()
					   , 'SYSTEM'
					   , '0.0.0.0'
					   , sysdate()
				from nx_counsel_item a
				where level = 2
				 and a.counsel_type_id = _CONTYPE
				 and a.counsel_item_id not in (select counsel_item_id 
				 								 from ua_call_est_dtl 
				 								where call_num = CALLNUMCHECK 
				 								  and start_time = _START_TIME
				 								  and extension = _EXTENSION 
				 								  and counsel_type_id = a.counsel_type_id
				 								  and emp_id = (select emp_id from nx_emp where cti_id = _AGENT_ID limit 1)
				 								  and dept_id = (select dept_id from nx_emp where cti_id = _AGENT_ID limit 1))
;

/*자동 만점 업데이트*/
	update (select lev3.counsel_type_id, lev3.counsel_item_id, lev3.item_point 
			  from nx_counsel_item as lev3 
			  left join nx_counsel_item as lev4 on lev4.pre_counsel_item_id = lev3.counsel_item_id 
			 where lev3.level = 2
			   and lev3.max_score_yn = 'Y'
			   and lev4.counsel_item_id is null) a, ua_call_est_dtl b
			set b.match_est_point = a.item_point
	  where b.call_num = CALLNUMCHECK
		and b.start_time = _START_TIME
		and b.extension = _EXTENSION
		and b.counsel_type_id = a.counsel_type_id
		and b.counsel_item_id = a.counsel_item_id
;

	/*평가 점수 합산 저장*/
	insert into ua_call_est ( call_num, start_time, extension, counsel_type_id, emp_id, dept_id
	, total_ai_point, reg_id, reg_ip, reg_dtm, mod_id, mod_ip, mod_dtm)
	select uced.call_num, uced.start_time, uced.extension, uced.counsel_type_id
	 	   , uced.emp_id, uced.dept_id, sum(match_est_point), 'SYSTEM', '0.0.0.0', sysdate(), 'SYSTEM', '0.0.0.0', sysdate()
	   from ua_call_est_dtl uced
	  where uced.call_num = CALLNUMCHECK
	    and uced.start_time = _START_TIME
	    and uced.extension = _EXTENSION
	    and uced.counsel_type_id = _CONTYPE
	  group by uced.call_num, uced.start_time, uced.extension, uced.counsel_type_id, uced.emp_id, uced.dept_id 
;

	/*평가 점수 메인 테이블 합산 저장*/
	update (select uce.call_num, uce.start_time, uce.extension, uce.total_ai_point, nx.bis_id, uce.counsel_type_id    
	 		   from ua_call_est uce
		   		    , nx_emp nx		
		      where uce.call_num = CALLNUMCHECK
		        and uce.start_time = _START_TIME
		        and uce.extension = _EXTENSION
		        and uce.emp_id = nx.emp_id) a, ua_call b
			set b.ai_score = a.total_ai_point, b.ai_yn = 'Y', b.bis_id = a.bis_id, mod_dtm = sysdate(), b.counsel_type_id = a.counsel_type_id
	  where a.call_num = b.call_num
		and a.start_time = b.start_time
		and a.extension = b.extension
;

/*임시 테이블 삭제 항상 비어있는 상태이여야함*/
/*delete from nx_counsel_item_his where call_set_seq = _CALL_SET_SEQ
;*/
commit;

end