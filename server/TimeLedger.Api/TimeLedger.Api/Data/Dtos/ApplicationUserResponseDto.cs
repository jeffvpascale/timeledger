namespace TimeLedger.Api.Data.Dtos
{
	public class ApplicationUserResponseDto
	{
		public string Id { get; set; } = String.Empty;

		public string Email { get; set; } = String.Empty;

		public string FirstName { get; set; } = String.Empty;

		public string LastName { get; set; } = String.Empty;

		public string? Company { get; set; }
	}
}
